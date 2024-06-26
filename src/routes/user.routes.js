import { Router } from "express";
import { changeCurrentPassword, getCurrentUser, getUserChannelProfile, getWatchHistory, loginUser, logoutUser, refreshAccessToken, registerUser, updateUserAvatar, updateUserDetails } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import { verify } from "jsonwebtoken";
const router = Router();


router.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount:1,
        },
        {
            name: "CoverImage",
            maxCount:1
        }
    ])
    ,
    registerUser);

router.route("/login").post(loginUser);

// secure routes
router.route("/logout").post(verifyJwt,logoutUser);
router.route("/refresh-token").post(refreshAccessToken);
router.route("/change-password").patch(verifyJwt,changeCurrentPassword);
router.route("/current-user").get(verifyJwt,getCurrentUser);
router.route("/update-account").patch(verifyJwt,updateUserDetails);
router.route("/update-avatar").patch(verifyJwt,upload.single("avatar"),updateUserAvatar);
router.route("/update-coverImage").patch(verifyJwt,upload.single("CoverImage"),updateUserCoverImage);
router.route("/channel/:username").get(verifyJwt,getUserChannelProfile);
router.route("/history").get(verifyJwt,getWatchHistory);


export default router; 