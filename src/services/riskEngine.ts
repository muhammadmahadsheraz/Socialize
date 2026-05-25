import idPatterns from '../config/idPatterns.json';
import * as checksumUtils from './checksumUtils';

const checksumFns: Record<string, (num: string) => boolean> = {
  latvianPersonalCode: checksumUtils.latvianPersonalCode,
};

export interface DetectionResult {
  country: keyof typeof idPatterns;
  idNumber: string;
}

function levenshtein(a: string, b: string): number {
  const matrix = [];
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          Math.min(
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          )
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

function calculateSimilarity(a: string, b: string): number {
  if (a.length === 0 && b.length === 0) return 1.0;
  if (a.length === 0 || b.length === 0) return 0.0;
  const distance = levenshtein(a, b);
  const maxLength = Math.max(a.length, b.length);
  return (maxLength - distance) / maxLength;
}

function normalizeName(name: string): string {
    return name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, ' ').trim();
}

// Country-specific ID patterns are checked before the generic fallback.
export function detectCountryByIdNumber(text: string): DetectionResult {
  const rawCandidates = text.match(/\b[A-Z0-9-]{5,20}\b/gi) ?? [];
  const candidates = rawCandidates.filter(c => /\d/.test(c));

  for (const candidate of candidates) {
    const cleaned = candidate.replace(/[-\s]/g, '').toUpperCase();

    for (const [code, { regex, checksum }] of Object.entries(idPatterns)) {
      if (code === 'default') continue;

      if (!new RegExp(regex).test(candidate)) continue;

      if (checksum) {
        const fn = checksumFns[checksum];
        if (fn && !fn(cleaned)) continue;
      }

      return { country: code as keyof typeof idPatterns, idNumber: candidate };
    }
  }

  const patternConfig = (idPatterns as any)['default'];
  const genericRegex = new RegExp(patternConfig.regex);
  for (const candidate of candidates) {
      if (genericRegex.test(candidate)) {
          return { country: 'default', idNumber: candidate };
      }
  }

  return { country: 'default', idNumber: candidates[0] ?? '' };
}



function extractDates(text: string): Date | null {
    const dateRegex = /\b(\d{2}[\/\-]\d{2}[\/\-]\d{4}|\d{4}[\/\-]\d{2}[\/\-]\d{2})\b/g;
    const matches = text.match(dateRegex);
    if (!matches) return null;

    let earliestDate: Date | null = null;
    for (const match of matches) {
        let parts = match.split(/[\/\-]/);
        let dateObj: Date;
        if (parts[0].length === 4) {
            dateObj = new Date(`${parts[0]}-${parts[1]}-${parts[2]}`);
        } else {
            dateObj = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
        }
        
        if (!isNaN(dateObj.getTime())) {
            if (!earliestDate || dateObj < earliestDate) {
                earliestDate = dateObj;
            }
        }
    }
    return earliestDate;
}

function extractNameCandidate(text: string, expectedName: string): string {
    const lines = text.split('\n');
    let bestMatch = '';
    let bestScore = 0;
    const normalizedExpected = normalizeName(expectedName);

    for (const line of lines) {
        const cleanedLine = normalizeName(line);
        if (/\d/.test(cleanedLine)) continue;
        if (cleanedLine.length < 3) continue;

        const score = calculateSimilarity(cleanedLine, normalizedExpected);
        if (score > bestScore) {
            bestScore = score;
            bestMatch = cleanedLine;
        }
    }
    return bestMatch;
}

export function evaluateRisk(rawText: string, expectedName: string) {
    const violations: string[] = [];
    let score = 0;

    const { country: countryCode, idNumber: nationalId } = detectCountryByIdNumber(rawText);
    const idPresent = !!nationalId && nationalId !== '' && countryCode !== 'default';
    if (!idPresent) {
        violations.push('ID number missing or does not match any recognized pattern');
    }

    const dateOfBirth = extractDates(rawText);
    let ageValid = false;
    if (!dateOfBirth) {
        violations.push('DOB not found or unparseable');
    } else {
        const ageDifMs = Date.now() - dateOfBirth.getTime();
        const ageDate = new Date(ageDifMs);
        const age = Math.abs(ageDate.getUTCFullYear() - 1970);
        if (age <= 13) {
            violations.push(`User is too young (Calculated age: ${age})`);
        } else if (age > 120) {
            violations.push(`Calculated age is unrealistic (${age})`);
        } else {
            ageValid = true;
        }
    }

    if (!idPresent || !ageValid) {
        return {
            riskScore: 0,
            violations,
            nationalId: nationalId || 'UNKNOWN',
            fullName: 'UNKNOWN',
            dateOfBirth,
            detectedCountry: countryCode
        };
    }

    const bestNameCandidate = extractNameCandidate(rawText, expectedName);
    const expectedTokens = normalizeName(expectedName).split(' ');
    const candidateTokens = normalizeName(bestNameCandidate).split(' ');
    let nameCredibility = 0;
    if (expectedTokens[0] && candidateTokens.includes(expectedTokens[0])) {
        nameCredibility = 0.5;
    }
    if (expectedTokens.length > 1 && expectedTokens[expectedTokens.length - 1] && candidateTokens.includes(expectedTokens[expectedTokens.length - 1])) {
        nameCredibility = 1.0;
    }
    score = nameCredibility === 1.0 ? 1.0 : (nameCredibility === 0.5 ? 0.8 : 0);
    if (score === 0) {
        violations.push('Name does not contain required first or last name from user record');
    }

    return {
        riskScore: score,
        violations,
        nationalId: nationalId || 'UNKNOWN',
        fullName: bestNameCandidate || 'UNKNOWN',
        dateOfBirth,
        detectedCountry: countryCode
    };
}
