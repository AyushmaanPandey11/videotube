import multer from "multer";

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, './public/temp')
    },
    filename: function (req, file, cb) {
      cb(null, file.originalname)
    }
  });
  
export const upload = multer({ storage,});

// this middleware will be used for the api endpoints where file from user is to be expected .the cb function here will return the 
// file with its original name which we will use to upload using cloudinary.js