import { ApiError } from "../../utils/ApiError.js";
import {asyncHandler} from "../utils/asyncHandler.js"
import {User} from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import {ApiResponse}  from "../utils/ApiResponse.js";
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
    const existedUser = await User.findOne({
            $or : [{ username }, { email }]
        })
    if(existedUser)
    {
        throw new ApiError(409, "User Already exists with given email or username");
    }
    const avatarLocalPath = req.files?.avatar[0]?.path;
    // const coverImageLocalPath = req.files?.coverImage[0]?.path;
    let coverImageLocalPath;
    if( req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length() > 0 )
    {
        coverImageLocalPath = req.files.coverImage[0].path;
    }

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
    // creating new user object and inserting into the db
    const user = await User.create(
        {
            fullname,
            username: username.toLowercase(),
            email,
            password,
            avatar: avatar.url,
            coverImage: coverImage?.url || "",
        }
    )
    // check if user is created
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    );
    if(!createdUser)
    {
        throw new ApiError(500,"Server Error while creating user in db ");
    }

    return res.status(201).json(
        new ApiResponse(200,createdUser,
            "User is created Successfully"
        )
    )

} )

export { registerUser };