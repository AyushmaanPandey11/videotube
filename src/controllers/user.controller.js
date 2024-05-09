import { ApiError } from "../../utils/ApiError.js";
import {asyncHandler} from "../utils/asyncHandler.js"
import {User} from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
const registerUser = asyncHandler( async (req,res) => {
    // validation
    // check if user already exists
    // check for images ie avatar or coverImage
    //upload them to cloudinary
    //create user obj for data entry to db
    // remove password and token from response and return response to client 

    const { fullname, username, email, password } = req.body;
    // validations
    if( [fullname,username,email,password].some((field) => 
        field?.trim() === "") )
    {
        throw new ApiError(400, "All Fields are required");
    }
    const existedUser = User.findOne({
            $or : [{ username }, { email }]
        })
    if(existedUser)
    {
        throw new ApiError(409, "User Already exists with given email or username");
    }
    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImageLocalPath = req.files?.coverImage[0]?.path;
    if(!avatarLocalPath)
    {
        throw new ApiError(400, "Avatar file is required");
    }
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);
    if(!avatar) 
    {
        throw new ApiError(400, "Error is uploading the avatar file");
    }
    

} )

export { registerUser };