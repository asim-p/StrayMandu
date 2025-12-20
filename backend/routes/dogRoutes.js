const express = require("express");
const router = express.Router();
const upload = require("../middlewares/upload");
const auth = require('../middlewares/authMiddleware'); //auth halna baki

const {
  addDog,
  getAllDogs,
  getDogById,
  updateDog,
  deleteDog,
} = require("../controllers/dogController");

router.post("/", auth, upload.array('photos', 5), addDog);

router.get("/", getAllDogs);

router.get("/:id", getDogById);

router.put("/:id", auth, updateDog);

router.delete("/:id", auth, deleteDog);

module.exports = router;
