const FaqCategory = require("../models/FaqCategory");
const FaqItem = require("../models/FaqItem");


// ==========================================================
// PUBLIC: ACTIVE CATEGORIES + ACTIVE ITEMS, ORDERED
// ==========================================================

const getPublicFaq = async () => {

    const categories = await FaqCategory.find({ isActive: true })
        .sort({ order: 1, createdAt: 1 })
        .lean();

    const categoryIds = categories.map((category) => category._id);

    const items = categoryIds.length > 0
        ? await FaqItem.find({ category: { $in: categoryIds }, isActive: true })
            .sort({ order: 1, createdAt: 1 })
            .lean()
        : [];

    const itemsByCategory = new Map();

    for (const item of items) {

        const key = String(item.category);

        if (!itemsByCategory.has(key)) {
            itemsByCategory.set(key, []);
        }

        itemsByCategory.get(key).push({
            _id: item._id,
            question: item.question,
            answer: item.answer,
        });

    }

    return categories
        .map((category) => ({
            _id: category._id,
            name: category.name,
            icon: category.icon,
            questions: itemsByCategory.get(String(category._id)) || [],
        }))
        .filter((category) => category.questions.length > 0);

};


// ==========================================================
// ADMIN: LIST ALL CATEGORIES (with item counts)
// ==========================================================

const getAdminCategories = async () => {

    const categories = await FaqCategory.find({})
        .sort({ order: 1, createdAt: 1 })
        .lean();

    const counts = await FaqItem.aggregate([
        { $group: { _id: "$category", count: { $sum: 1 } } },
    ]);

    const countByCategory = new Map(
        counts.map((row) => [String(row._id), row.count])
    );

    return categories.map((category) => ({
        ...category,
        itemCount: countByCategory.get(String(category._id)) || 0,
    }));

};


// ==========================================================
// ADMIN: CREATE CATEGORY
// ==========================================================

const createCategory = async ({ name, icon, order, isActive }) => {

    const cleanName = String(name || "").trim();

    if (!cleanName) {
        throw new Error("Category name is required.");
    }

    return await FaqCategory.create({
        name: cleanName,
        icon: String(icon || "help-circle").trim() || "help-circle",
        order: Number.isFinite(Number(order)) ? Number(order) : 0,
        isActive: isActive !== false,
    });

};


// ==========================================================
// ADMIN: UPDATE CATEGORY
// ==========================================================

const updateCategory = async (categoryId, updates) => {

    const category = await FaqCategory.findById(categoryId);

    if (!category) {
        throw new Error("FAQ category not found.");
    }

    if (updates.name !== undefined) {

        const cleanName = String(updates.name || "").trim();

        if (!cleanName) {
            throw new Error("Category name is required.");
        }

        category.name = cleanName;

    }

    if (updates.icon !== undefined) {
        category.icon = String(updates.icon || "help-circle").trim() || "help-circle";
    }

    if (updates.order !== undefined) {
        category.order = Number.isFinite(Number(updates.order)) ? Number(updates.order) : category.order;
    }

    if (updates.isActive !== undefined) {
        category.isActive = Boolean(updates.isActive);
    }

    await category.save();

    return category;

};


// ==========================================================
// ADMIN: DELETE CATEGORY (and its items - a category with no
// questions is meaningless, so this is a real delete, not a
// soft one; the questions themselves carry no financial/audit
// weight worth preserving)
// ==========================================================

const deleteCategory = async (categoryId) => {

    const category = await FaqCategory.findById(categoryId);

    if (!category) {
        throw new Error("FAQ category not found.");
    }

    await FaqItem.deleteMany({ category: categoryId });

    await FaqCategory.deleteOne({ _id: categoryId });

    return { deleted: true };

};


// ==========================================================
// ADMIN: LIST ITEMS (optionally by category)
// ==========================================================

const getAdminItems = async (categoryId) => {

    const filter = categoryId ? { category: categoryId } : {};

    return await FaqItem.find(filter)
        .populate("category", "name")
        .sort({ order: 1, createdAt: 1 })
        .lean();

};


// ==========================================================
// ADMIN: CREATE ITEM
// ==========================================================

const createItem = async ({ category, question, answer, order, isActive }) => {

    const cleanQuestion = String(question || "").trim();
    const cleanAnswer = String(answer || "").trim();

    if (!category) {
        throw new Error("Category is required.");
    }

    if (!cleanQuestion) {
        throw new Error("Question is required.");
    }

    if (!cleanAnswer) {
        throw new Error("Answer is required.");
    }

    const categoryExists = await FaqCategory.exists({ _id: category });

    if (!categoryExists) {
        throw new Error("Selected FAQ category does not exist.");
    }

    return await FaqItem.create({
        category,
        question: cleanQuestion,
        answer: cleanAnswer,
        order: Number.isFinite(Number(order)) ? Number(order) : 0,
        isActive: isActive !== false,
    });

};


// ==========================================================
// ADMIN: UPDATE ITEM
// ==========================================================

const updateItem = async (itemId, updates) => {

    const item = await FaqItem.findById(itemId);

    if (!item) {
        throw new Error("FAQ item not found.");
    }

    if (updates.category !== undefined) {

        const categoryExists = await FaqCategory.exists({ _id: updates.category });

        if (!categoryExists) {
            throw new Error("Selected FAQ category does not exist.");
        }

        item.category = updates.category;

    }

    if (updates.question !== undefined) {

        const cleanQuestion = String(updates.question || "").trim();

        if (!cleanQuestion) {
            throw new Error("Question is required.");
        }

        item.question = cleanQuestion;

    }

    if (updates.answer !== undefined) {

        const cleanAnswer = String(updates.answer || "").trim();

        if (!cleanAnswer) {
            throw new Error("Answer is required.");
        }

        item.answer = cleanAnswer;

    }

    if (updates.order !== undefined) {
        item.order = Number.isFinite(Number(updates.order)) ? Number(updates.order) : item.order;
    }

    if (updates.isActive !== undefined) {
        item.isActive = Boolean(updates.isActive);
    }

    await item.save();

    return item;

};


// ==========================================================
// ADMIN: DELETE ITEM
// ==========================================================

const deleteItem = async (itemId) => {

    const item = await FaqItem.findById(itemId);

    if (!item) {
        throw new Error("FAQ item not found.");
    }

    await FaqItem.deleteOne({ _id: itemId });

    return { deleted: true };

};


module.exports = {
    getPublicFaq,
    getAdminCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    getAdminItems,
    createItem,
    updateItem,
    deleteItem,
};
