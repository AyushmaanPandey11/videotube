import { ApiError } from "../utils/ApiError.js";
import {asyncHandler} from "../utils/asyncHandler.js"
import {User} from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import {ApiResponse}  from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";

const generateAccessAndRefreshToken = async (userId) => {
    try
    {
        const user = await User.findById(userId);
        const accessToken = await user.generateAccessToken();
        const refreshToken = await user.generateRefreshToken();
        user.refreshToken= refreshToken;
        await user.save({validateBeforeSave:false});
        return {accessToken,refreshToken};
    }
    catch(err)
    {
        throw new ApiError(500, "Error creating the access and refresh token from server side");
    }
};


const registerUser = asyncHandler( async (req,res) => {
    // validation
    // check if user already exists
    // check for images ie avatar or coverImage
    // upload them to cloudinary
    // create user obj for data entry to db
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
            username: username.toLowerCase(),
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

} );

const loginUser = asyncHandler( async (req,res) => {

    // req.body input 
    // validation 
    // find the user
    // password check
    //access and refresh token
    // create and send cookie

    const { email, username, password } = req.body;
    // validation 
    if( !email && !username ) 
    {
        throw new ApiError(400, " username or email is requied for Signing in ");
    }
    const user = await User.findOne({
        $or : [{username},{email}]
    });

    if(!user)
    {
        throw new ApiError(400, "User doesnot exists");
    }
    // password checking 
    const isPasswordCorrect = await user.isPasswordCorrect(password);
    if(!isPasswordCorrect)
    {
        throw new ApiError(400, "Invalid password credentials")
    }
    // creating access and refresh token
    const {accessToken,refreshToken} = await generateAccessAndRefreshToken(user._id);
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

    const options = {
        httpOnly : true,
        secure : true
    }
    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken,options)
    .json(
        new ApiResponse(
            200,
            {
                user: loggedInUser, accessToken,
                refreshToken
            },
            "User Logged in Successfully"
        )
    );

} );

const logoutUser = asyncHandler( async (req,res) => {
    const user = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken : undefined,
            }
        },
        {
            new : true
        }
    );
    const options = {
        httpOnly : true,
        secure : true
    }

    return res
    .status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(
        new ApiResponse(200,"User loggedOut Successfully")
    )


} )

const refreshAccessToken = asyncHandler( async (req,res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if(!incomingRefreshToken)
    {
        throw new ApiError(401,"Unauthorized request");
    }
    try {
        const decodedToken = jwt.verify(incomingRefreshToken,process.env.ACCESS_TOKEN_SECRET);
        const user = await User.findById(decodedToken?._id);
        if(!user)
        {
            throw new ApiError(401, "Invalid refresh token");
        }
        if( incomingRefreshToken !== user?.refreshToken )
        {
            throw new ApiError(401,"refresh Token is expired or invalid");
        }

        const {newRefreshToken,accessToken} = await generateAccessAndRefreshToken(user?._id);
        const options = {
            httpOnly : true,
            secure : true
        }

        return res
        .status(200)
        .cookie("accessToken", accessToken,options)
        .cookie("refreshToken",newRefreshToken,options)
        .json(
            new ApiResponse(200, 
                {
                    accessToken , refreshToken: newRefreshToken
                },
                "Access and refresh Token refreshed"
            )
        )
    } catch (error) {
        throw new ApiError(400, "Invalid Refresh token");
    }
} )

const changeCurrentPassword = asyncHandler( async (req,res) => {
    // req.body - oldpassword and newpassword
    // req.user( auth middleware ) take id to find the user db value 
    // check for oldpassword same with db password
    // user.password = newpassword
    // user.save()
    const {oldPassword, newPassword} = req.body;
    
    const user = await User.findById(req.user?._id);
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);
    if(!isPasswordCorrect)
    {
        throw new ApiError(400, "Incorrect old password");
    } 
    user.password=newPassword;
    user.save({validateBeforeSave:false});
    return res
    .status(200)
    .json(new  ApiResponse(200, "Password changed successfully"));
    
} )


const getCurrentUser = asyncHandler( async (req,res) => {
    return res
        .status(200)
        .json(new ApiResponse(200, req.user, "User details fetched successfully"));
} )

const updateUserDetails = asyncHandler( async(req,res) => {
    const { fullname, email } = req.body;

    if( !fullname || !email )
    {
        throw new ApiError(400, "Fill all user details");
    }

    const user = User.findByIdAndUpdate(
        req.user?._id,
        {   
            $set: {
                fullname,
                email 
            }
        },
        { new: true}
    ).select("-password ");

    return res
    .status(200)
    .json(new ApiResponse(200, user ,"User details updated successfully"));
} )

const updateUserAvatar = asyncHandler( async (req,res) => {
    const avatarLocalPath = req.file;
    if(!avatarLocalPath)
    {
        throw new ApiError(401, "Avatar file is missing ");
    }
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    if(!avatar.url)
    {
        throw new ApiError(401, "Error in uploading the avatar file to CDN");
    }
    await User.findByIdAndUpdate(req.user?._id,
    {
        $set: {
            avatar : avatar.url,
        }   
    },
    {
        new: true
    }
    ).select(" -password");
    return res
        .status(200)
        .json(200, req.user, "User Avatar Updated successfully");
} )

const updateUsercoverImage = asyncHandler( async (req,res) => {
    const coverImageLocalPath = req.file;
    if(!coverImageLocalPath)
    {
        throw new ApiError(401, "coverImage file is missing ");
    }
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);
    if(!coverImage.url)
    {
        throw new ApiError(401, "Error in uploading the coverImage file to CDN");
    }
    await User.findByIdAndUpdate(req.user?._id,
    {
        $set: {
            coverImage : coverImage.url,
        }   
    },
    {
        new: true
    }
    ).select(" -password");
    return res
        .status(200)
        .json(new ApiResponse(200, req.user, "User coverImage Updated successfully"));
} )

export { registerUser, 
        loginUser, 
        logoutUser, 
        refreshAccessToken, 
        getCurrentUser, 
        updateUserDetails, 
        updateUserAvatar,
        updateUsercoverImage };