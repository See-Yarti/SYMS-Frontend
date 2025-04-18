import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Package, Tag, Plus, Trash2, Image as ImageIcon, Loader2 } from 'lucide-react';
import { SidebarMenuSubItem, SidebarMenuButton } from '@/components/ui/sidebar';
import { Label } from '../ui/label';
import { Separator } from '../ui/separator';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import axios from 'axios';
import { toast } from 'sonner';

type SideBarItem = {
  type: 'separation' | 'routed' | 'dropdown' | 'dynamic-product-type';
  title: string;
  url?: string;
  slug?: string;
  icon?: React.ComponentType<{ className?: string }>;
  isHorizontal?: boolean;
  position?: 'bottom' | 'top';
  items?: SideBarItem[];
};

interface SidebarMenuItemsProps {
  currentMenu: SideBarItem[];
  selectedPath: number[];
  setSelectedPath: React.Dispatch<React.SetStateAction<number[]>>;
}

const api = axios.create({
  baseURL: 'http://localhost:3000/api',
});

export function SidebarMenuItems({
  currentMenu,
  selectedPath,
  setSelectedPath,
}: SidebarMenuItemsProps) {
  const [productTypes, setProductTypes] = useState<any[]>([]);
  const [loadingProductTypes, setLoadingProductTypes] = useState(false);

  useEffect(() => {
    const fetchProductTypes = async () => {
      setLoadingProductTypes(true);
      try {
        const response = await api.get('/product-type');
        if (response.data.success) {
          setProductTypes(response.data.data.productTypes || []);
        }
      } catch (error) {
        console.error('Error fetching product types:', error);
        toast.error('Failed to load product types');
      } finally {
        setLoadingProductTypes(false);
      }
    };

    fetchProductTypes();
  }, []);

  return (
    <>
      {currentMenu.map((item, index) => {
        if (item.type === 'separation') {
          return <SidebarSeparationItem key={item.title} item={item} />;
        }

        if (item.type === 'routed') {
          return <SidebarRoutedItem key={item.title} item={item} />;
        }

        if (item.type === 'dynamic-product-type') {
          return (
            <React.Fragment key="product-types-section">
              {loadingProductTypes ? (
                <div className="px-4 py-2 text-sm text-muted-foreground flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading product types...
                </div>
              ) : (
                <>
                  {productTypes.map((productType) => (
                    <ProductTypeItem
                      key={productType.id}
                      productType={productType}
                    />
                  ))}
                </>
              )}
            </React.Fragment>
          );
        }

        return (
          <SidebarDropdownItem
            key={item.title}
            item={item}
            index={index}
            selectedPath={selectedPath}
            setSelectedPath={setSelectedPath}
          />
        );
      })}
    </>
  );
}

function ProductTypeItem({ productType }: { productType: any }) {
  const [isOpen, setIsOpen] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [openCategoryId, setOpenCategoryId] = useState<string | null>(null);

  const fetchCategories = async () => {
    setLoadingCategories(true);
    try {
      const response = await api.get('/category', {
        params: {
          productTypeSlug: productType.slug,
          limit: 10,
          page: 1,
          sortBy: 'name',
          sortOrder: 'desc'
        }
      });

      if (response.data.success && response.data.data?.categories) {
        setCategories(response.data.data.categories);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error('Failed to load categories');
    } finally {
      setLoadingCategories(false);
    }
  };

  const fetchSubCategories = async (categorySlug: string) => {
    try {
      const response = await api.get('/sub-category', {
        params: {
          categorySlug: categorySlug,
          limit: 10,
          page: 1,
          sortBy: 'name',
          sortOrder: 'desc'
        }
      });

      if (response.data.success && response.data.data?.subCategories) {
        return response.data.data.subCategories;
      }
      return [];
    } catch (error) {
      console.error('Error fetching subcategories:', error);
      toast.error('Failed to load subcategories');
      return [];
    }
  };

  const handleDeleteCategory = async (category: any) => {
    try {
      // Check if category has subcategories
      if (category.subCategories?.length > 0) {
        toast.error('Cannot delete category: It contains subcategories');
        return;
      }
  
      let inputValue = '';
      let toastId: string | number;
      const confirmed = await new Promise<boolean>((resolve) => {
        const dialog = (
          <Dialog open={true} onOpenChange={(open) => {
            if (!open) {
              toast.dismiss(toastId);
              resolve(false);
            }
          }}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete Category</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete "{category.name}"? This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Type the category name to confirm</Label>
                  <Input
                    placeholder={`Type "${category.name}"`}
                    onChange={(e) => {
                      inputValue = e.target.value;
                    }}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      toast.dismiss(toastId);
                      resolve(false);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => {
                      if (inputValue === category.name) {
                        toast.dismiss(toastId);
                        resolve(true);
                      } else {
                        toast.error('Name does not match');
                      }
                    }}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        );
  
        toastId = toast.custom(() => dialog, {
          duration: Infinity,
        });
      });
  
      if (!confirmed) return;
  
      await api.delete(`/category/${category.slug}`);
      setCategories(categories.filter(c => c.slug !== category.slug));
      toast.success(`Category "${category.name}" deleted successfully`);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to delete category';
      toast.error(errorMessage);
    }
  };
  
  const handleDeleteSubCategory = async (subCategory: any, categoryId: string) => {
    try {
      let inputValue = '';
      let toastId: string | number;
      const confirmed = await new Promise<boolean>((resolve) => {
        const dialog = (
          <Dialog open={true} onOpenChange={(open) => {
            if (!open) {
              toast.dismiss(toastId);
              resolve(false);
            }
          }}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete Subcategory</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete "{subCategory.name}"? This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Type the subcategory name to confirm</Label>
                  <Input
                    placeholder={`Type "${subCategory.name}"`}
                    onChange={(e) => {
                      inputValue = e.target.value;
                    }}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      toast.dismiss(toastId);
                      resolve(false);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => {
                      if (inputValue === subCategory.name) {
                        toast.dismiss(toastId);
                        resolve(true);
                      } else {
                        toast.error('Name does not match');
                      }
                    }}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        );
  
        toastId = toast.custom(() => dialog, {
          duration: Infinity,
        });
      });
  
      if (!confirmed) return;
  
      await api.delete(`/sub-category/${subCategory.slug}`);
      setCategories(categories.map(c =>
        c.id === categoryId
          ? { ...c, subCategories: c.subCategories.filter((sc: any) => sc.slug !== subCategory.slug) }
          : c
      ));
      toast.success(`Subcategory "${subCategory.name}" deleted successfully`);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to delete subcategory';
      toast.error(errorMessage);
    }
  };

  const handleProductTypeClick = async () => {
    if (!isOpen && categories.length === 0) {
      await fetchCategories();
    }
    setIsOpen(!isOpen);
  };

  const handleCategoryClick = async (categoryId: string, categorySlug: string) => {
    if (openCategoryId === categoryId) {
      setOpenCategoryId(null);
    } else {
      setOpenCategoryId(categoryId);
      const category = categories.find(c => c.id === categoryId);
      if (category && !category.subCategories) {
        const subCategories = await fetchSubCategories(categorySlug);
        setCategories(categories.map(c =>
          c.id === categoryId ? { ...c, subCategories } : c
        ));
      }
    }
  };

  return (
    <div className="px-1">
      <div className="flex items-center group">
        <SidebarMenuButton
          tooltip={productType.name}
          onClick={handleProductTypeClick}
          className="text-sm flex-1"
        >
          <Package className="w-4 h-4" />
          <span>{productType.name}</span>
          <ChevronRight className={`ml-auto w-4 h-4 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
        </SidebarMenuButton>
      </div>

      {isOpen && (
        <div className="ml-4 max-h-96 overflow-y-auto">
          {loadingCategories ? (
            <div className="px-4 py-1 text-sm text-muted-foreground flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading categories...
            </div>
          ) : categories.length > 0 ? (
            <>
              {categories.map((category) => (
                <div key={category.id} className="pl-2">
                  <div className="flex items-center group/category-container">
                    <div
                      className="flex items-center p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer flex-1"
                      onClick={() => handleCategoryClick(category.id, category.slug)}
                    >
                      <Tag className="w-4 h-4 mr-2" />
                      <span className="text-sm flex-1">{category.name}</span>
                      {category.subCategories?.length > 0 && (
                        <ChevronRight className={`w-4 h-4 transition-transform ${openCategoryId === category.id ? 'rotate-90' : ''}`} />
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover/category-container:opacity-100"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteCategory(category);
                      }}
                    >
                      <Trash2 className="w-3 h-3 text-destructive" />
                    </Button>
                  </div>

                  {openCategoryId === category.id && category.subCategories && (
                    <div className="ml-4 pl-2 border-l-2 border-gray-200 dark:border-gray-700">
                      {category.subCategories.length > 0 ? (
                        category.subCategories.map((subCategory: any) => (
                          <div key={subCategory.id} className="flex items-center group/subcategory-container">
                            <Link
                              to={`/products/${productType.slug}/${category.slug}/${subCategory.slug}`}
                              className="flex items-center gap-2 text-sm p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded flex-1"
                            >
                              <span className="ml-4">• {subCategory.name}</span>
                            </Link>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 opacity-0 group-hover/subcategory-container:opacity-100"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteSubCategory(subCategory, category.id);
                              }}
                            >
                              <Trash2 className="w-3 h-3 text-destructive" />
                            </Button>
                          </div>
                        ))
                      ) : null}
                      <div className="mt-1 mb-2 mx-2 p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors">
                        <AddSubCategoryDialog
                          categorySlug={category.slug}
                          onSuccess={(newSubCategory) => {
                            setCategories(categories.map(c =>
                              c.id === category.id
                                ? { ...c, subCategories: [...(c.subCategories || []), newSubCategory] }
                                : c
                            ));
                            if (openCategoryId !== category.id) setOpenCategoryId(category.id);
                          }}                        >
                          <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground py-1">
                            <Plus className="w-4 h-4" />
                            <span>Add Subcategory</span>
                          </div>
                        </AddSubCategoryDialog>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              <div className="mt-2 mb-1 mx-2 p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors">
                <AddCategoryDialog
                  productTypeSlug={productType.slug}
                  onSuccess={(newCategory) => {
                    setCategories([...categories, newCategory]);
                    if (!isOpen) setIsOpen(true);
                  }}
                >
                  <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground py-1">
                    <Plus className="w-4 h-4" />
                    <span>Add Category</span>
                  </div>
                </AddCategoryDialog>
              </div>
            </>
          ) : (
            <div className="mt-2 mb-1 mx-2 p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors">
              <AddCategoryDialog
                productTypeSlug={productType.slug}
                onSuccess={(newCategory) => {
                  setCategories([...categories, newCategory]);
                  if (!isOpen) setIsOpen(true);
                }}
              >
                <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground py-1">
                  <Plus className="w-4 h-4" />
                  <span>Add Category</span>
                </div>
              </AddCategoryDialog>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function AddCategoryDialog({
  productTypeSlug,
  onSuccess,
  children
}: {
  productTypeSlug: string,
  onSuccess: (category: any) => void,
  children?: React.ReactNode
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState<File | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('productTypeSlug', productTypeSlug);
      formData.append('name', name);
      formData.append('description', description);
      if (image) formData.append('image', image);

      const response = await api.post('/category/create', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        onSuccess(response.data.data.category);
        setOpen(false);
        toast.success("Category created successfully");
        setName('');
        setDescription('');
        setImage(null);
      }
    } catch (error: unknown) {
      console.error('Failed to create category:', error);
      toast.error("Failed to create category");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="ghost" size="icon" className="h-6 w-6">
            <Plus className="w-3 h-3" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Category</DialogTitle>
          <DialogDescription>
            Create a new category under this product type.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Name *</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter category name"
              required
            />
          </div>
          <div>
            <Label>Description</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter description"
            />
          </div>
          <div>
            <Label>Image</Label>
            <div className="flex items-center gap-2">
              <Label htmlFor="category-image" className="cursor-pointer border rounded p-2 flex items-center gap-2">
                <ImageIcon className="w-4 h-4" />
                {image ? image.name : 'Choose an image'}
              </Label>
              <Input
                id="category-image"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => setImage(e.target.files?.[0] || null)}
              />
              {image && (
                <Button variant="outline" size="sm" onClick={() => setImage(null)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function AddSubCategoryDialog({
  categorySlug,
  onSuccess,
  children
}: {
  categorySlug: string,
  onSuccess: (subCategory: any) => void,
  children?: React.ReactNode
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState<File | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('categorySlug', categorySlug);
      formData.append('name', name);
      formData.append('description', description);
      if (image) formData.append('image', image);

      const response = await api.post('/sub-category/create', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        onSuccess(response.data.data.subCategory);
        setOpen(false);
        toast.success("Subcategory created successfully");
        setName('');
        setDescription('');
        setImage(null);
      }
    } catch (error: unknown) {
      console.error('Failed to create subcategory:', error);
      toast.error("Failed to create subcategory");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="ghost" size="icon" className="h-6 w-6">
            <Plus className="w-3 h-3" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Subcategory</DialogTitle>
          <DialogDescription>
            Create a new subcategory under this category.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Name *</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter subcategory name"
              required
            />
          </div>
          <div>
            <Label>Description</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter description"
            />
          </div>
          <div>
            <Label>Image</Label>
            <div className="flex items-center gap-2">
              <Label htmlFor="subcategory-image" className="cursor-pointer border rounded p-2 flex items-center gap-2">
                <ImageIcon className="w-4 h-4" />
                {image ? image.name : 'Choose an image'}
              </Label>
              <Input
                id="subcategory-image"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => setImage(e.target.files?.[0] || null)}
              />
              {image && (
                <Button variant="outline" size="sm" onClick={() => setImage(null)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function SidebarSeparationItem({ item }: { item: SideBarItem }) {
  return (
    <React.Fragment>
      {item.isHorizontal && item.position == 'top' && (
        <div className="flex justify-center items-center">
          <Separator className="mr-2 h-[1.5px] w-1/2" />
        </div>
      )}
      <Label className="text-xs text-muted-foreground dark:text-gray-50 font-medium font-abel">
        {item.title}
      </Label>
      {item.isHorizontal && item.position == 'bottom' && (
        <div className="flex justify-center items-center">
          <Separator className="mr-2 h-[1.5px] w-1/2" />
        </div>
      )}
    </React.Fragment>
  );
}

function SidebarRoutedItem({ item }: { item: SideBarItem }) {
  return (
    <SidebarMenuSubItem className="px-1">
      <SidebarMenuButton tooltip={item.title} className="text-sm">
        {item.type === 'routed' ? (
          <Link to={item.url || '#'} className="flex w-full items-center gap-2">
            {item.icon && <item.icon className="w-4 h-4" />}
            <span>{item.title}</span>
          </Link>
        ) : (
          <>
            {item.icon && <item.icon className="w-4 h-4" />}
            <span>{item.title}</span>
          </>
        )}
      </SidebarMenuButton>
    </SidebarMenuSubItem>
  );
}

function SidebarDropdownItem({
  item,
  index,
  selectedPath,
  setSelectedPath,
}: {
  item: SideBarItem;
  index: number;
  selectedPath: number[];
  setSelectedPath: React.Dispatch<React.SetStateAction<number[]>>;
}) {
  const isOpen = selectedPath.includes(index);

  return (
    <SidebarMenuSubItem className="px-1">
      <SidebarMenuButton
        tooltip={item.title}
        onClick={() =>
          setSelectedPath(
            isOpen
              ? selectedPath.filter((i) => i !== index)
              : [...selectedPath, index],
          )
        }
      >
        {item.icon && <item.icon className="w-4 h-4" />}
        <span>{item.title}</span>
        <ChevronRight className={`ml-auto w-4 h-4 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
      </SidebarMenuButton>
    </SidebarMenuSubItem>
  );
}