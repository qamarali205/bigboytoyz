const User = require("../models/user.model");
const { generateToken } = require("../utils/jwt");
const bcrypt = require("bcryptjs");

const NodeCache = require('node-cache');
const axios = require('axios');
const { sendEmail } = require("../config/email");
const Video = require("../models/video.model");
const { uploadSingleImageToCloudflare } = require("../utils/upload");

const cache = new NodeCache({ stdTTL: process.env.CACHE_TTL || 300 });

const generateOtp = () => Math.floor(10000 + Math.random() * 900000);


function generatePassword(firstName, lastName, mobileNumber) {
  // Check if inputs are valid
  if (!firstName || !lastName || !mobileNumber) {
      return "Invalid input";
  }

  // Get the first 2 letters of first name and last name
  const firstPart = firstName.slice(0, 2);
  const lastPart = lastName.slice(0, 2);

  // Get the last 3 digits of the mobile number
  const numberPart = mobileNumber.toString().slice(-3);

  // Get the current timestamp (YYYYMMDDHHMMSS)
  const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);


  // Combine all parts to create the password
  let password = firstPart.toLowerCase() + lastPart.toLowerCase() + numberPart  + timestamp.slice(-3);

  // Ensure the password is not longer than 12 characters
  return password.slice(0, 12);
}




exports.registerUser =async (req, res) => {
  try {
    const { firstName, lastName, userEmail, mobileNumber} = req.body;

   // Check if any required field is missing
if (!firstName || !lastName || !userEmail || !mobileNumber) {
  return res
    .status(400)
    .json({
      status: 400,
      message: "Please provide all the required fields: first name, last name, email, and mobile number. If you have only one name, please enter the same name for both first name and last name."
    });
}


    // Check if the user already exists
    const existingUser = await User.findOne({ userEmail });
    if (existingUser) {
      return res
        .status(400)
        .json({ status: 400, message: "User already exists. Check your register email account inbox for password." });
    }

    const passwordWithOutHash=generatePassword(firstName, lastName, mobileNumber);
    // Hash the password before saving
    // console.log(passwordWithOutHash)
    const hashedPassword = await bcrypt.hash(passwordWithOutHash, 10);

    // Create a new user object
    const newUser = new User({
      firstName,
      lastName,
      userEmail, 
      mobileNumber, 
      password: hashedPassword,      
    });
    // console.log(hashedPassword)

    // Save the user to the database
    await newUser.save();

    // Generate a JWT token
    const token = generateToken(newUser);

    const subject = "Thank you for Creating your Account.";
    const userData = newUser; // Add any user data if needed
    const recipientEmail = `${userEmail}`; // Replace with your test recipient email
    // const body = `Your OTP for resetting your password is ${otp}. This OTP is valid for 60 minutes.`;

    const body = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Registration Mail</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #f4f4f4;
            margin: 0;
            padding: 0;
            color: #333333;
        }
        .container {
            width: 100%;
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            padding: 20px;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
        }
        .header {
            background-color: #007bff;
            padding: 20px;
            text-align: center;
            color: white;
            font-size: 24px;
            font-weight: bold;
        }
        .content {
            padding: 20px;
            text-align: center;
        }
        .otp-code {
            font-size: 32px;
            font-weight: bold;
            color: #007bff;
            margin: 20px 0;
            letter-spacing: 4px;
        }
        .footer {
            text-align: center;
            padding: 20px;
            font-size: 14px;
            color: #666666;
        }
        @media (max-width: 600px) {
            .header, .content, .footer {
                padding: 10px;
            }
            .otp-code {
                font-size: 28px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            Your Account has been successfully Generated.
        </div>
        <div class="content">
            <p>Dear ${firstName +' '+ lastName || "User"},</p>
            <p>Email: ${userEmail}</p>
            <p>MobileNumber ${mobileNumber}</p>
            <p>Password: ${passwordWithOutHash}</p>
        </div>
    </div>
</body>
</html>
`;
    await sendEmail(subject, recipientEmail, body);

    // Respond with the user data and token
    res.status(201).json({
      status: 201,
      message: "User created successfully",
      user: newUser,
      token,
    });
  } catch (error) {
    res.status(500).json({status:500, error: error.message });
  }
};


exports.loginUser = async (req, res) => {
  try {
    const { userEmail, password } = req.body;

    if (!userEmail || !password) {
      return res.status(400).json({
        status: 400,
        message: "Email and password are required",
      });
    }

    const user = await User.findOne({ userEmail });
    if (!user) {
      return res.status(400).json({
        status: 400,
        message: "Invalid email or password",
      });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({
        status: 400,
        message: "Invalid email or password",
      });
    }

    const token = generateToken(user);

    // Exclude the password field from the user object
    const { password: userPassword, ...userWithoutPassword } = user.toObject();
    

    res.status(200).json({
      status: 200,
      token,
      message: "Login Successful",
      data:userWithoutPassword,
    });
  } catch (error) {
    res.status(500).json({
      status: 500,
      message: "Login Failed",
      error: error.message,
    });
  }
};



exports.addProfileDetails =async (req, res) =>{

  try {
    // Assuming req.user contains the decoded token with userId
    const userId = req.user.id;

    const { bio } = req.body;

    const wordCount = bio?.trim().split(/\s+/).length;

    if(wordCount>400){
      return res.status(400).json({
        status: 400,
        message: "The boi field must contain less than 400 words.",
      });

    }

    // Fetch the user details based on userId from req.user
    const user = await User.findById(userId).select('-password');
// console.log(user)
// return;
  user.boi=bio;
 await user.save();

 res.status(200).json({
  status: 200,
      message: "Bio Update Successful",
      data:user,

 })
    
  } catch (err) {
    res
      .status(500)
      .json({ status: 500, message: "Server Error", error: err.message });
    
  }

}





//updateProfilePic

exports.updateProfilePic =async (req, res) =>{

  try {
    
    const maxSize = 1 * 1024 * 1024; // 1MB image size less than 1Mb
    const userId = req.user.id; // user id decode from jwt token middleware
    const  file  = req.file;

// console.log(file)
    if(!file){
      return res.status(400).json({
        status: 400,
        message: "Select An Image",
      });
    }

    if (file.size > maxSize) {
      return res.status(400).send({
        status: 400,
        message: 'Profile image size must be less than 1MB.'
      });
    }

    // console.log(file)
    // return;

    let profile;
    if (file) {
      profile = await uploadSingleImageToCloudflare(
        file,
        "profilePic"
      );
    }

    // Fetch the user details based on userId from req.user
    const user = await User.findById(userId).select('-password');

  user.profileImage=profile;
 await user.save();

 res.status(200).json({
  status: 200,
      message: "image Update Successful",
      data:user,

 })
    
  } catch (err) {
    res
      .status(500)
      .json({ status: 500, message: "Server Error", error: err.message });
    
  }

}














//Add Video with Thumbnail

exports.addVideowithThumbnail = async (req, res) => {
  try {
    // Assuming req.user contains the decoded token with userId
    const userId = req.user.id;

    const { title, description } = req.body;
    const { video, thumbnail } = req.files;

     // Validate input
     if (!title || !video || !description || !thumbnail) {
      return res.status(400).send({status:400,message:'Title, description ,thumbnail and video are required'});
    }

    const titleCount = title?.trim().split(/\s+/).length;

    if(titleCount>30){
      return res.status(400).json({
        status: 400,
        message: "The video title field must contain less than 20 words.",
      });

    }

    const descriptionCount = description?.trim().split(/\s+/).length;

    if(descriptionCount<120){
      return res.status(400).json({
        status: 400,
        message: "The video description field must contain less than 20 words.",
      });

    }

    // Fetch the user details based on userId from req.user
    const user = await User.findById(userId);
    // console.log(thumbnail)
    // // return;
    if (!user) {
      return res.status(404).json({status:404, error: 'User not found' });
    }

     // Validate video file format and size
     const videoFile = video[0];
     const allowedVideoTypes = ['video/mp4'];
     const maxSize = 6 * 1024 * 1024; // 7MB

    if (!allowedVideoTypes.includes(videoFile.mimetype)) {
      return res.status(400).send({
        status: 400,
        message: 'Invalid video format. Only MP4 files are allowed.'
      });
    }

    if (videoFile.size > maxSize) {
      return res.status(400).send({
        status: 400,
        message: 'Video file size must be less than 7MB.'
      });
    }

    let videoUrl;
    if (video) {
      videoUrl = await uploadSingleImageToCloudflare(videoFile, 'videos'); // Assuming you will create this function
    }

    let imageUrl;
    if (thumbnail) {
       imageUrl = await uploadSingleImageToCloudflare(
        thumbnail[0],
        "thumbnail"
      );
    }

    // console.log(imageUrl);
    // return

    // Create a new video
    const newVideo = new Video({
      userId,
      title,
      description,
      thumbnailUrl:imageUrl,
      videoUrl:videoUrl    
    });

    // Save the new incident
    await newVideo.save();


    // Respond with the created incident
    res.status(201).json({status:201,
      data:newVideo});
  } catch (error) {
    console.error('Error creating video:', error);
    res.status(500).json({status:500, error: 'Error creating video' });
  }
};



exports.getVideoByToken = async (req, res) =>{
  try {
    const userId=req?.user?.id;


    const video=await Video.find({userId});
    
    res.status(200).json({status:200,
      data:video});
  } catch (error) {
    console.error('Error creating incident:', error);
    res.status(500).json({status:500, error: 'Error creating incident' });
  }
}



//getVideoById


exports.getVideoById = async (req, res) =>{

  try{
  const id=req?.params?.id;
   // Validate that the ID is provided
    if (!id) {
      return res.status(400).json({
        status: 400,
        error: 'Video ID is required'
      });
    }



    const video=await Video.findById(id);
    
    res.status(200).json({status:200,
      data:video});
  } catch (error) {
    console.error('Error creating incident:', error);
    res.status(500).json({status:500, error: 'Error creating incident' });
  }

  
}




//getAllVideoForAdmin


exports.getAllVideoForAdmin = async (req, res) => {
  try {

    const page = req.query.page || 1; // Current page number
    const pageSize = req.query.pageSize || 10; // Number of users per page

    // Count total users (documents) to calculate total pages
    const totalUsersCount = await User.countDocuments();

    // Calculate total pages
    const totalPages = Math.ceil(totalUsersCount / pageSize);

    // Fetch the paginated users data with video details
    const data = await User.aggregate([
      {
        $lookup: {
          from: "videos", // The collection containing the videos
          localField: "_id", // User's ID
          foreignField: "userId", // Field in the videos collection that references the user's ID
          as: "videos" // Name of the field to hold the user's videos
        }
      },
      {
        $unwind: "$videos" // Unwind the videos array so we can sort them by createdAt
      },
      {
        $sort: {
          "videos.createdAt": -1 // Sort videos by `createdAt` in descending order (latest first)
        }
      },
      {
        $group: {
          _id: "$_id", // Group back by user ID
          firstName: { $first: "$firstName" },
          lastName: { $first: "$lastName" },
          userEmail: { $first: "$userEmail" },
          profileImage: { $first: "$profileImage" },
           // Limit videos array to the first 5 videos
           videos: { $slice: ["$videos", 5] }
        }
      },
      {
        $project: {
          firstName: 1,
          lastName: 1,
          userEmail: 1,
          profileImage: 1,
          videos: 1 // Include the sorted video details in the output
        }
      },
      {
        $skip: (page - 1) * pageSize // Skip records based on current page and page size
      },
      {
        $limit: pageSize // Limit the number of users per page
      }
    ]);

    // Send the result along with pagination metadata
    res.status(200).json({
      status: 200,
      pagination: {
        currentPage: page,  // Current page
        pageSize: pageSize, // Number of users per page
        totalUsers: totalUsersCount, // Total number of users
        totalPages: totalPages  // Total number of pages
      },
      data: data // Paginated user data with videos
      
    });
  } catch (error) {
    console.error("Error fetching data", error);
    res.status(500).json({ status: 500, error: "Error fetching data" });
  }
};


// getUserAllVideoById

exports.getUserAllVideoById = async (req, res) => {
  try {
    const page = req.query.page || 1; // Current page number
    const pageSize = req.query.pageSize || 100; // Number of videos per page

    const userId = req?.params?.id; // Get the user ID from the params

    // Validate that the user ID is provided
    if (!userId) {
      return res.status(400).json({
        status: 400,
        error: 'User ID is required' // Updated error message to reflect userId
      });
    }

    // Count total videos for the user to calculate total pages
    const totalUsersVideo = await Video.countDocuments({ userId });

    // Calculate total pages
    const totalPages = Math.ceil(totalUsersVideo / pageSize);

    // Fetch the paginated videos for the user
    const data = await Video.find({ userId })
      .skip((page - 1) * pageSize) // Skip based on current page and page size
      .limit(pageSize) // Limit the number of videos per page
      .sort({ createdAt: -1 }); // Optionally, sort by creation date, descending (latest videos first)

    // Send the result along with pagination metadata
    res.status(200).json({
      status: 200,
      pagination: {
        currentPage: page, // Current page
        pageSize: pageSize, // Number of videos per page
        totalVideos: totalUsersVideo, // Total number of videos for the user
        totalPages: totalPages, // Total number of pages
      },
      data: data, // Paginated video data
    });
  } catch (error) {
    console.error("Error fetching data", error);
    res.status(500).json({ status: 500, error: "Error fetching data" });
  }
};


