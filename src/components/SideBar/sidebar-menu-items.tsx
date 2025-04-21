import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Package, Tag, Plus, Trash2, Image as ImageIcon, Loader2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SidebarMenuSubItem, SidebarMenuButton } from '@/components/ui/sidebar';
import { Label } from '../ui/label';
import { Separator } from '../ui/separator';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { toast } from 'sonner';
import { axiosInstance } from '@/lib/API';

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

export function SidebarMenuItems({
  currentMenu,
  selectedPath,
  setSelectedPath,
}: SidebarMenuItemsProps) {
  const { data: productTypesData, isLoading: isLoadingProductTypes } = useQuery({
    queryKey: ['productTypes'],
    queryFn: async () => {
      const { data } = await axiosInstance.get('/product-type');
      return data;
    },
  });

  const productTypes = productTypesData?.data?.productTypes || [];

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
              {isLoadingProductTypes ? (
                <div className="px-4 py-2 text-sm text-muted-foreground flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading product types...
                </div>
              ) : (
                <>
                  {productTypes.map((productType: any) => (
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
  const [openCategoryId, setOpenCategoryId] = useState<string | null>(null);
  const [subCategories, setSubCategories] = useState<Record<string, any[]>>({});
  const [isLoadingSubCategories, setIsLoadingSubCategories] = useState<Record<string, boolean>>({});
  const queryClient = useQueryClient();

  const { data: categoriesData, isLoading: isLoadingCategories } = useQuery({
    queryKey: ['categories', productType.slug],
    queryFn: async () => {
      const { data } = await axiosInstance.get('/category', {
        params: {
          productTypeSlug: productType.slug,
          limit: 10,
          page: 1,
          sortBy: 'name',
          sortOrder: 'desc'
        }
      });
      return data;
    },
    enabled: isOpen,
  });

  const categories = categoriesData?.data?.categories || [];

  const fetchSubCategories = async (categorySlug: string) => {
    setIsLoadingSubCategories(prev => ({ ...prev, [categorySlug]: true }));
    try {
      const { data } = await axiosInstance.get('/sub-category', {
        params: {
          categorySlug: categorySlug,
          limit: 10,
          page: 1,
          sortBy: 'name',
          sortOrder: 'desc'
        }
      });
      return data.data?.subCategories || [];
    } catch (error) {
      console.error('Error fetching subcategories:', error);
      return [];
    } finally {
      setIsLoadingSubCategories(prev => ({ ...prev, [categorySlug]: false }));
    }
  };

  const handleCategoryClick = async (categoryId: string, categorySlug: string) => {
    if (openCategoryId === categoryId) {
      setOpenCategoryId(null);
    } else {
      setOpenCategoryId(categoryId);
      if (!subCategories[categorySlug]) {
        const fetchedSubCategories = await fetchSubCategories(categorySlug);
        setSubCategories(prev => ({
          ...prev,
          [categorySlug]: fetchedSubCategories
        }));
      }
    }
  };

  const { mutate: deleteCategory, isPending: isDeletingCategory } = useMutation({
    mutationFn: async (categorySlug: string) => {
      await axiosInstance.delete(`/category/${categorySlug}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories', productType.slug] });
      toast.success('Category deleted successfully');
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || 'Failed to delete category';
      toast.error(errorMessage);
    }
  });

  const { mutate: deleteSubCategory, isPending: isDeletingSubCategory } = useMutation({
    mutationFn: async ({ subCategorySlug, categorySlug }: { subCategorySlug: string; categorySlug: string }) => {
      await axiosInstance.delete(`/sub-category/${subCategorySlug}`);
      return { categorySlug };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['categories', productType.slug] });
      fetchSubCategories(variables.categorySlug).then(fetchedSubCategories => {
        setSubCategories(prev => ({
          ...prev,
          [variables.categorySlug]: fetchedSubCategories
        }));
      });
      toast.success('Subcategory deleted successfully');
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || 'Failed to delete subcategory';
      toast.error(errorMessage);
    }
  });

  const { mutate: createCategory, isPending: isCreatingCategory } = useMutation({
    mutationFn: async (formData: FormData) => {
      const { data } = await axiosInstance.post('/category/create', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories', productType.slug] });
      toast.success('Category created successfully');
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || 'Failed to create category';
      toast.error(errorMessage);
    }
  });

  const { mutate: createSubCategory, isPending: isCreatingSubCategory } = useMutation({
    mutationFn: async ({ formData, categorySlug }: { formData: FormData; categorySlug: string }) => {
      const { data } = await axiosInstance.post('/sub-category/create', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return { data, categorySlug };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['categories', productType.slug] });
      fetchSubCategories(result.categorySlug).then(fetchedSubCategories => {
        setSubCategories(prev => ({
          ...prev,
          [result.categorySlug]: fetchedSubCategories
        }));
      });
      toast.success('Subcategory created successfully');
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || 'Failed to create subcategory';
      toast.error(errorMessage);
    }
  });

  const handleDeleteCategory = async (category: any) => {
    if (subCategories[category.slug]?.length > 0) {
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
                  {isDeletingCategory ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Delete'}
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

    if (confirmed) {
      deleteCategory(category.slug);
    }
  };

  const handleDeleteSubCategory = async (subCategory: any, categorySlug: string) => {
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
                  {isDeletingSubCategory ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Delete'}
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

    if (confirmed) {
      deleteSubCategory({ subCategorySlug: subCategory.slug, categorySlug });
    }
  };

  return (
    <div className="px-1">
      <div className="flex items-center group">
        <SidebarMenuButton
          tooltip={productType.name}
          onClick={() => setIsOpen(!isOpen)}
          className="text-sm flex-1"
        >
          <Package className="w-4 h-4" />
          <span>{productType.name}</span>
          <ChevronRight className={`ml-auto w-4 h-4 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
        </SidebarMenuButton>
      </div>

      {isOpen && (
        <div className="ml-4 max-h-96 overflow-y-auto">
          {isLoadingCategories ? (
            <div className="px-4 py-1 text-sm text-muted-foreground flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading categories...
            </div>
          ) : categories.length > 0 ? (
            <>
              {categories.map((category: any) => (
                <div key={category.id} className="pl-2">
                  <div className="flex items-center group/category-container">
                    <div
                      className="flex items-center p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer flex-1"
                      onClick={() => handleCategoryClick(category.id, category.slug)}
                    >
                      <Tag className="w-4 h-4 mr-2" />
                      <span className="text-sm flex-1">{category.name}</span>
                      <ChevronRight
                        className={`ml-auto w-4 h-4 transition-transform ${openCategoryId === category.id ? 'rotate-90' : ''}`}
                      />
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

                  {openCategoryId === category.id && (
                    <div className="ml-4 pl-2 border-l-2 border-gray-200 dark:border-gray-700">
                      {isLoadingSubCategories[category.slug] ? (
                        <div className="px-4 py-1 text-sm text-muted-foreground flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Loading subcategories...
                        </div>
                      ) : (
                        <>
                          {subCategories[category.slug]?.length > 0 ? (
                            subCategories[category.slug].map((subCategory: any) => (
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
                                    handleDeleteSubCategory(subCategory, category.slug);
                                  }}
                                >
                                  <Trash2 className="w-3 h-3 text-destructive" />
                                </Button>
                              </div>
                            ))
                          ) : (
                            <div className="text-sm text-muted-foreground ml-4 py-1">
                              No subcategories found
                            </div>
                          )}
                          <div className="mt-1 mb-2 mx-2 p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors">
                            <AddSubCategoryDialog
                              categorySlug={category.slug}
                              onCreate={(formData) => createSubCategory({ formData, categorySlug: category.slug })}
                              isCreating={isCreatingSubCategory}
                            >
                              <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground py-1">
                                <Plus className="w-4 h-4" />
                                <span>Add Subcategory</span>
                              </div>
                            </AddSubCategoryDialog>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              ))}
              <div className="mt-2 mb-1 mx-2 p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors">
                <AddCategoryDialog
                  productTypeSlug={productType.slug}
                  onCreate={createCategory}
                  isCreating={isCreatingCategory}
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
                onCreate={createCategory}
                isCreating={isCreatingCategory}
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

// ... (keep all other component implementations the same as in previous code)

function AddCategoryDialog({
  productTypeSlug,
  onCreate,
  isCreating,
  children
}: {
  productTypeSlug: string;
  onCreate: (formData: FormData) => void;
  isCreating: boolean;
  children?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState<File | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Category name is required');
      return;
    }

    const formData = new FormData();
    formData.append('productTypeSlug', productTypeSlug);
    formData.append('name', name);
    formData.append('description', description);
    if (image) {
      formData.append('image', image);
    }

    onCreate(formData);
    setOpen(false);
    setName('');
    setDescription('');
    setImage(null);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
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
            <Button type="submit" disabled={isCreating}>
              {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function AddSubCategoryDialog({
  categorySlug,
  onCreate,
  isCreating,
  children
}: {
  categorySlug: string;
  onCreate: (formData: FormData) => void;
  isCreating: boolean;
  children?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState<File | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Subcategory name is required');
      return;
    }

    const formData = new FormData();
    formData.append('categorySlug', categorySlug);
    formData.append('name', name);
    formData.append('description', description);
    if (image) {
      formData.append('image', image);
    }

    onCreate(formData);
    setOpen(false);
    setName('');
    setDescription('');
    setImage(null);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
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
            <Button type="submit" disabled={isCreating}>
              {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create'}
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