# videotube
-  Backend project of storing data for a Video streaming web app. 
# Features 
- MongoDb Cloud database connection
- Mongoose CRUD Operations 
- MongDb Pipelines
    - Nested pipelines
- VerifyJWT middleware 
- Access and Refresh Token for user Authentication
- Used multer for taking and storing user image and video files to server
- UploadOnCloudinary for storing avatar and coverImage of 
- Utilities
    - Classes of ApiResponse and APiError for response code resusablity
    - AsyncHandler for try and catch block reusablity in controllers
- Local methods on database model( ispasswordCorrect, uploadoncloudinary, generating access and refresh token )
- Controller for User registration, Signing, update user details(password,image files).
# Database Models
- Users 
- Subscriptions
- Videos