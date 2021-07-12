const express = require("express");
let router = express.Router();
var {
  User,
  UserDetails,
  SellerDetails,
  BuilderDetails,
  AdminDetails,
  BuilderAdditionalDetails,
  ShippingAddress,
} = require("../../models/user");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const config = require("config");
const validateNewUser = require("../../middlewares/validateUser");
const validateUser = require("../../middlewares/validatelogin");
const auth = require("../../middlewares/auth");
const validatelogin = require("../../middlewares/validatelogin");
const validateBuilderInfo = require("../../middlewares/validateBuilderInfo");
const { Product } = require("../../models/product");
const { ObjectId } = require("bson");
const { Store } = require("../../models/store");

function generateAccessToken(data) {
  // expires after half and hour (1800 seconds = 30 minutes)
  return jwt.sign(data, config.get("jwtprivatekey"), {
    expiresIn: "1800s",
  });
}

//register

router.post("/register", validateNewUser, async (req, res) => {
  let user = await User.findOne({ email: req.body.email });

  if (user) return res.status(400).send("User already exists");

  user = new User();
  user.name = req.body.username;
  user.email = req.body.email;
  user.password = req.body.password;
  user.role = req.body.role;

  await user.generateHashedPassword();
  await user.save();

  //Save additional details

  // if(user.role=="user"){
  //   console.log(user.contact);
  // userDeatils=new UserDetails();

  // userDeatils.cnic=req.body.cnic;

  // userDetails.userID=user._id;

  // await userDetails.save();
  // }
  // else
  if (user.role == "Seller") {
    sellerDetails = new SellerDetails();
    sellerDetails.sellerPhone = req.body.sellerPhone;
    sellerDetails.storeName = req.body.storeName;
    sellerDetails.sellerId = user._id;
    sellerDetails.shopAddress = req.body.shopAddress;

    await sellerDetails.save();
  } else if (user.role == "Builder") {
    builderDetails = new BuilderDetails();
    builderDetails.companyPhone = req.body.companyPhone;
    builderDetails.companyName = req.body.companyName;
    builderDetails.builderId = user._id;
    builderDetails.companyAddress = req.body.companyAddress;

    await builderDetails.save();
  } else if (user.role == "admin") {
    adminDetails = new AdminDetails();
    adminDetails.hobby = req.body.hobby;

    adminDetails.adminId = user._id;

    await adminDetails.save();
  }
  let token1 = generateAccessToken({
    username: req.body.username,
    role: req.body.role,
    userId: user._id,
  });

  return res.send(token1);
});

//login

router.post("/login", validatelogin, async (req, res) => {
  let user = await User.findOne({ email: req.body.email });
  if (!user) return res.status(400).send("Username doesn't exist");
  let isValid = await bcrypt.compare(req.body.password, user.password);
  if (!isValid) return res.status(400).send("Password incorrect!");
  let checkRole = (await req.body.role) !== user.role ? false : true;
  if (!checkRole) return res.status(400).send("No user found under this role");

  if (user.role == "User") {
    let details = await UserDetails.findOne({ userId: user._id });
    let token = generateAccessToken({
      username: user.name,
      role: req.body.role,
      _id: user._id,
      email: req.body.email,
    });

    return res.send(token);
  }

  if (user.role == "Seller") {
    let details = await SellerDetails.findOne({ sellerId: user._id });
    let token = generateAccessToken({
      username: user.name,
      role: req.body.role,
      _id: user._id,
      email: req.body.email,
      shopAddress: details.shopAddress,
      shopName: details.storeName,
      sellerPhone: details.sellerPhone,
    });

    return res.send(token);
  }

  if (user.role == "Builder") {
    let details = await BuilderDetails.findOne({ builderId: user._id });
    let token = generateAccessToken({
      username: user.name,
      role: req.body.role,
      _id: user._id,
      email: req.body.email,
      companyAddress: details.companyAddress,
      companyName: details.companyName,
    });
    return res.send(token);
  }

  if (user.role == "Admin") {
    let details = await AdminDetails.findOne({ adminId: user._id });
    let token = generateAccessToken({
      username: user.name,
      role: req.body.role,
    });
    return res.send(token);
  }
});

//update users
router.put("/update/:id", async (req, res) => {
  let user = await User.findById(req.params.id);
  if (!user) return res.status(400).send("User not exists");

  user.name = req.body.username;
  if (req.body.password != "") {
    user.password = req.body.password;
    await user.generateHashedPassword();
  }

  await user.save();

  //Save additional details

  // if(user.role=="user"){
  //   console.log(user.contact);
  // userDeatils=new UserDetails();

  // userDeatils.cnic=req.body.cnic;

  // userDetails.userID=user._id;

  // await userDetails.save();
  // }
  // else
  if (user.role == "Seller") {
    console.log("seller schema .........");
    let sellerDetails = await SellerDetails.findOne({
      sellerId: req.params.id,
    });
    console.log(sellerDetails);
    if (!sellerDetails) res.send("seller details not found");
    sellerDetails.sellerPhone = req.body.sellerPhone;
    sellerDetails.storeName = req.body.shopName;
    sellerDetails.shopAddress = req.body.shopAddress;
    await sellerDetails.save();
  } else if (user.role == "Builder") {
    let builderDetails = await BuilderDetails.findOne({
      builderId: req.params.id,
    });
    builderDetails.companyPhone = req.body.companyPhone;
    builderDetails.companyName = req.body.companyName;
    builderDetails.companyAddress = req.body.companyAddress;
    await builderDetails.save();
  } else if (user.role == "admin") {
    let adminDetails = await AdminDetails.findOne({ adminId: req.params.id });
    adminDetails.hobby = req.body.hobby;
    await adminDetails.save();
  }
  return res.send("Updated Successfully!");
});

router.get(
  "/builderAdditionalDetails/:id",

  async (req, res) => {
    let builderAdditionalDetails = await BuilderAdditionalDetails.findOne({
      builderId: req.params.id,
    });
    if (!builderAdditionalDetails) {
      res.send(false);
    }
    res.send(builderAdditionalDetails);
  }
);

router.get(
  "/builderAdditionalDetails",

  async (req, res) => {
    let builderAdditionalDetails = await BuilderAdditionalDetails.find();
    if (!builderAdditionalDetails) {
      res.send("No records found");
    }
    res.send(builderAdditionalDetails);
  }
);

router.put(
  "/builderAdditionalDetails/:id",
  validateBuilderInfo,
  async (req, res) => {
    let builderAdditionalDetails = await BuilderAdditionalDetails.findOne({
      builderId: req.params.id,
    });
    if (!builderAdditionalDetails) res.status(400).send("builder Not Found !");
    builderAdditionalDetails.builderId = req.params.id;

    builderAdditionalDetails.companyName = req.body.companyName;
    builderAdditionalDetails.portfolio = req.body.portfolio;
    builderAdditionalDetails.establishedIn = req.body.establishedIn;
    builderAdditionalDetails.businessEntity = req.body.businessEntity;
    builderAdditionalDetails.noOfEmployees = req.body.noOfEmployees;
    builderAdditionalDetails.location = req.body.location;
    builderAdditionalDetails.phoneNumber = req.body.phoneNumber;
    builderAdditionalDetails.logo = req.body.logo;
    builderAdditionalDetails.coverImage = req.body.coverImage;
    builderAdditionalDetails.aboutCompany = req.body.aboutCompany;

    await builderAdditionalDetails.save();
    res.send(builderAdditionalDetails);
  }
);

//builder additional details
router.post(
  "/builderAdditionalDetails/:id",
  validateBuilderInfo,
  async (req, res) => {
    let builderAdditionalDetails = await BuilderAdditionalDetails.findOne({
      builderId: req.params.id,
    });
    if (builderAdditionalDetails)
      return res.status(400).send("User already exists");

    builderAdditionalDetails = new BuilderAdditionalDetails();
    builderAdditionalDetails.builderId = req.params.id;
    builderAdditionalDetails.companyName = req.body.companyName;
    builderAdditionalDetails.portfolio = req.body.portfolio;
    builderAdditionalDetails.establishedIn = req.body.establishedIn;
    builderAdditionalDetails.businessEntity = req.body.businessEntity;
    builderAdditionalDetails.noOfEmployees = req.body.noOfEmployees;
    builderAdditionalDetails.location = req.body.location;
    builderAdditionalDetails.phoneNumber = req.body.phoneNumber;
    builderAdditionalDetails.logo = req.body.logo;
    builderAdditionalDetails.coverImage = req.body.coverImage;
    builderAdditionalDetails.aboutCompany = req.body.aboutCompany;

    await builderAdditionalDetails.save();
    res.send(builderAdditionalDetails);
  }
);

// get vendors data

router.get(
  "/vendors",

  async (req, res) => {
    let record = SellerDetails.aggregate([
      {
        $lookup: {
          from: "users",
          localField: "sellerId",
          foreignField: "_id",
          as: "details",
        },
      },
    ]).then((data) => {
      res.send(data);
    });
  }
);

router.delete("/deleteVendor/:id", async (req, res) => {
  let sellerDet = await SellerDetails.deleteMany({
    sellerId: ObjectId(req.params.id),
  });
  let seller = await User.findByIdAndDelete(req.params.id);
  let products = await Product.deleteMany({ storeId: req.params.id });
  let store = await Store.deleteMany({ storeId: req.params.id });
  let builder = await BuilderDetails.deleteMany({ builderId: req.params.id });
  let builderDet = await BuilderAdditionalDetails.deleteMany({
    builderId: req.params.id,
  });

  return res.send("Deleted Successfuly");
});

// Get all users
router.get(
  "/",

  async (req, res) => {
    let users = await User.find();
    if (!users) {
      res.send("No records found");
    }
    res.send(users);
  }
);

router.get(
  "/builders",

  async (req, res) => {
    let users = await User.find({ role: "Builder" });
    if (!users) {
      res.send("No records found");
    }
    res.send(users);
  }
);

router.post("/shipping/:id", async (req, res) => {
  let shipping = await ShippingAddress.findOne({ userId: req.params.id });

  if (shipping) return res.status(400).send("Already exists");

  shipping = new ShippingAddress();
  shipping.userId = req.params.id;
  shipping.streetAddress = req.body.streetAddress;
  shipping.city = req.body.city;
  shipping.postalCode = req.body.postalCode;

  await shipping.save();
  return res.send(shipping);
});

router.put("/shipping/:id", async (req, res) => {
  let shipping = await ShippingAddress.findOne({ userId: req.params.id });

  if (!shipping) return res.status(400).send("No record Found!");

  shipping.userId = req.params.id;
  shipping.streetAddress = req.body.streetAddress;
  shipping.city = req.body.city;
  shipping.postalCode = req.body.postalCode;

  await shipping.save();
  return res.send(shipping);
});

router.get("/shipping/:id", async (req, res) => {
  let shipping = await ShippingAddress.findOne({ userId: req.params.id });

  if (!shipping) return res.send(false);

  return res.send(shipping);
});

module.exports = router;
