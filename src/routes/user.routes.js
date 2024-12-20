const express = require('express');
const multer = require("multer");
const userController = require('../controller/user.controller');

const authMiddleware = require('../middlewares/authMiddleware');
const router = express.Router();

const upload = multer({});


router.post('/registration', userController.registerUser);


router.post("/login",  userController.loginUser);



router.post('/add-profile',authMiddleware, userController.addProfileDetails );

router.post('/update-profile-pic',authMiddleware, upload.single('profile'), userController.updateProfilePic );




router.post('/upload-video', authMiddleware, upload.fields([{ name: 'video' }, { name: 'thumbnail' }]), userController.addVideowithThumbnail);

router.get('/video/getall', authMiddleware, userController.getVideoByToken);

router.get('/video/:id', authMiddleware, userController.getVideoById);

//list of all users with Video for Admin

router.get('/admin/getallvideo', userController.getAllVideoForAdmin);

//list of user all video using id
router.get('/admin/getall/:id', userController.getUserAllVideoById)






module.exports = router;
