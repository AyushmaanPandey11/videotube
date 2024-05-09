import {v2 as cloudinary} from 'cloudinary';
import fs from "fs";


const uploadOnCloudinary = async (localFilePath) => {
    try{
        if(!localFilePath)  return null;
        const response= await cloudinary.uploader.upload(localFilePath,
                { resource_type : "auto" },  );
        //console.log("File uploaded successfully ", response.url);
        fs.unlinkSync(localFilePath);
        return response;
    }
    catch(err)
    {
        // it deleted the temporarily saved file from disk 
        fs.unlinkSync(localFilePath);
        return null;
    }
}
          
cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET 
});


export {uploadOnCloudinary};