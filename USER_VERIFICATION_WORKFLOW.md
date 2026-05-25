# User Verification Workflow

This document outlines the workflow for users verifying their identity by uploading an ID card. We use Google Cloud Vision API to perform text detection on the uploaded image to ensure it is a valid ID card.

## 1. API Endpoint

**`POST /api/verification`**

This endpoint handles the ID card image upload and verification process. It expects a `multipart/form-data` payload.

### Request Payload (`multipart/form-data`)

| Field | Type | Description |
| :--- | :--- | :--- |
| `userId` | `string` | The ID of the user attempting to verify their account. |
| `idImage` | `file` (image) | The image file of the user's ID card (e.g., driver's license, passport). Maximum file size is 5MB. |

### Request Headers

No specific authentication headers are strictly required by the route itself, but it is expected that the frontend has already authenticated the user.

## 2. Process Flow

1. **Image Upload:** The client sends the `multipart/form-data` request containing the `userId` and the `idImage`.
2. **Temporary Storage:** The backend (`multer` middleware) temporarily stores the uploaded image in the server's OS temp directory.
3. **Google Vision Validation:** The `verificationService` sends the image to the Google Cloud Vision API for text detection.
4. **Analysis:** The service analyzes the detected text looking for common ID-related keywords (e.g., "identity", "id", "card", "license", "passport").
5. **Database Update:** If validation is successful, the user's `isVerified` flag is set to `true` in the database.
6. **Cleanup:** Regardless of success or failure, the temporarily stored image file is deleted from the server to respect user privacy.

## 3. Responses

### Success Response

When the ID card is successfully verified:

**Code:** `200 OK`
**Content-Type:** `application/json`

```json
{
  "success": true,
  "message": "User successfully verified",
  "data": {
    "userId": "60d5ecb8b392d7... (example user id)",
    "isVerified": true
  }
}
```

### Error Responses

**No User ID Provided:**
**Code:** `400 Bad Request`
```json
{
  "success": false,
  "message": "User ID is required in the form data"
}
```

**No Image Provided:**
**Code:** `400 Bad Request`
```json
{
  "success": false,
  "message": "No ID image provided"
}
```

**Verification Failed (Image is blurry, no text detected, or doesn't match ID heuristics):**
**Code:** `400 Bad Request`
```json
{
  "success": false,
  "message": "Could not verify ID from the provided image. Please ensure the image is clear and text is readable."
}
```

**User Not Found:**
**Code:** `404 Not Found`
```json
{
  "success": false,
  "message": "User not found"
}
```

## 4. Frontend Integration Steps

1.  Provide an interface for the user to select an image from their device or take a photo using their camera.
2.  Append the selected image and the user's `userId` to a `FormData` object.
3.  Send a POST request using `fetch` or `axios` to the `/api/verification` endpoint with the `FormData` as the body. **Do not** set the `Content-Type` header manually; the browser will automatically set it to `multipart/form-data` with the correct boundary when sending a `FormData` object.
4.  Handle the response, updating the UI to reflect the verified status on success, or display the appropriate error message on failure.
