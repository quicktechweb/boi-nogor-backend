import Translator from "../models/Translator.js";

// Get all translators
export const getTranslators = async (req, res) => {
  try {
    const translators = await Translator.find();
    res.json(translators);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Add translator
export const addTranslator = async (req, res) => {
  try {
    const { translatorName, status, translatorImg } = req.body;
    const newTranslator = new Translator({ translatorName, status, translatorImg });
    const savedTranslator = await newTranslator.save();
    res.status(201).json(savedTranslator);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Update translator
export const updateTranslator = async (req, res) => {
  try {
    const updated = await Translator.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Delete translator
export const deleteTranslator = async (req, res) => {
  try {
    await Translator.findByIdAndDelete(req.params.id);
    res.json({ message: "Translator deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};