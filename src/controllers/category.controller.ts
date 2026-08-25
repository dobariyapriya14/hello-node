import { Request, Response } from 'express';
import Category from '../models/category';

export interface AuthRequest extends Request {
  user?: any;
}

//Get categories
export const getCategories = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const filter: any = {};
    if (req.user?.id) {
      filter.$or = [{ userId: req.user.id }, { userId: null }, { userId: { $exists: false } }];
    }

    const categories = await Category.find(filter).sort({ name: 1 });
    res.status(200).json({ success: true, data: categories });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const createCategory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, color, icon } = req.body;

    if (!name) {
      res.status(400).json({ success: false, message: 'Category name is required' });
      return;
    }

    const category = await Category.create({
      name,
      color: color || '#3B82F6',
      icon: icon || 'folder',
      userId: req.user?.id || undefined,
    });

    res.status(201).json({ success: true, data: category });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const updateCategory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, color, icon } = req.body;

    const category = await Category.findById(id);
    if (!category) {
      res.status(404).json({ success: false, message: 'Category not found' });
      return;
    }

    if (name !== undefined) category.name = name;
    if (color !== undefined) category.color = color;
    if (icon !== undefined) category.icon = icon;

    await category.save();
    res.status(200).json({ success: true, data: category });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const deleteCategory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const category = await Category.findByIdAndDelete(id);

    if (!category) {
      res.status(404).json({ success: false, message: 'Category not found' });
      return;
    }

    res.status(200).json({ success: true, message: 'Category deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};
