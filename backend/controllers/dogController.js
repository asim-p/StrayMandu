const Dog = require("../models/Dog");

exports.addDog = async (req, res) => {
  try {
    const dog = new Dog(req.body);
    const savedDog = await dog.save();
    res.status(201).json({ 
        success: true, 
        data: savedDog 
    });
  } catch (error) {
    res.status(400).json({ 
        success: false, 
        message: error.message 
    });
  }
};


exports.getAllDogs = async (req, res) => {
  try {
    const dogs = await Dog.find().sort({ createdAt: -1 });
    res.status(200).json({ 
        success: true, 
        data: dogs 
    });
  } catch (error) {
    res.status(500).json({ 
        success: false, 
        message: error.message 
    });
  }
};

exports.getDogById = async (req, res) => {
  try {
    const dog = await Dog.findById(req.params.id);
    if (!dog) {
        return res.status(404).json({ 
            success: false, 
            message: "Dog not found" 
        });
    }
    res.status(200).json({ 
        success: true, 
        data: dog 
    });
  } catch (error) {
    res.status(500).json({ 
        success: false, 
        message: error.message 
    });
  }
};

exports.updateDog = async (req, res) => {
  try {
    const updatedDog = await Dog.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedDog) {
        return res.status(404).json({ 
        success: false, 
        message: "Dog not found" 
    });}
    res.status(200).json({ 
        success: true, 
        data: updatedDog 
    });
  } catch (error) {
    res.status(400).json({ 
        success: false, 
        message: error.message 
    });
  }
};

exports.deleteDog = async (req, res) => {
  try {
    const deletedDog = await Dog.findByIdAndDelete(req.params.id);
    if (!deletedDog){
        return res.status(404).json({ 
            success: false, 
            message: "Dog not found" 
        });
    }
    res.status(200).json({ 
        success: true, 
        message: "Dog record deleted" 
    });
  } catch (error) {
    res.status(500).json({ 
        success: false, 
        message: error.message 
    });
  }
};
