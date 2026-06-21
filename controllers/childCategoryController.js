// controllers/childCategoryController.js
import ChildCategory from "../models/ChildCategory.js";

// ✅ Create
export const createChildCategory = async (req, res) => {
  try {
    const {
      name,
      categoryName,
      subcategoryName,
      status,
      childCategoryImg,
      isAuthor,
      description,
    } = req.body;

    const newChild = new ChildCategory({
      name,
      categoryName,
      subcategoryName,
      status,
      childCategoryImg,
      isAuthor: isAuthor || false,
      description: description || "",
    });

    await newChild.save();
    res.status(201).json(newChild);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ Read (all)
export const getChildCategories = async (req, res) => {
  try {
    const children = await ChildCategory.find();
    res.json(children);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// ✅ Follow / Unfollow toggle (AuthorCard থেকে কল হয়)


// ✅ Update
export const updateChildCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      categoryName,
      subcategoryName,
      status,
      childCategoryImg,
      isAuthor,
      description,
    } = req.body;

    const updated = await ChildCategory.findByIdAndUpdate(
      id,
      {
        name,
        categoryName,
        subcategoryName,
        status,
        childCategoryImg,
        isAuthor: isAuthor || false,
        description: description || "",
      },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Child Category not found" });
    }

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ Delete
export const deleteChildCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await ChildCategory.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ message: "Child Category not found" });
    }

    res.json({ message: "Child Category deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ Follow / Unfollow toggle (AuthorCard এর জন্য — followers এবং followedBy update করে)
export const toggleFollowAuthor = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ success: false, message: "userId required" });
    }

    const author = await ChildCategory.findById(id);
    if (!author) {
      return res.status(404).json({ success: false, message: "Not found" });
    }

    if (!author.isAuthor) {
      return res.status(400).json({ success: false, message: "This entry is not an author" });
    }

    const alreadyFollowed = author.followedBy.includes(userId);

    if (alreadyFollowed) {
      author.followedBy = author.followedBy.filter((uid) => uid !== userId);
      author.followers = Math.max(0, author.followers - 1);
    } else {
      author.followedBy.push(userId);
      author.followers += 1;
    }

    await author.save();

    res.json({
      success: true,
      followers: author.followers,
      isFollowed: !alreadyFollowed,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};