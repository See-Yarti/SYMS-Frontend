import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { Palette, Sun, Moon, Monitor, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

type ThemeOption = 'light' | 'dark' | 'system';

const Appearance = () => {
  const { theme, setTheme } = useTheme();
  const [selectedTheme, setSelectedTheme] = useState<ThemeOption>((theme as ThemeOption) || 'system');

  useEffect(() => {
    if (theme) {
      setSelectedTheme(theme as ThemeOption);
    }
  }, [theme]);

  const handleSave = () => {
    setTheme(selectedTheme);
  };

  const handleCancel = () => {
    setSelectedTheme((theme as ThemeOption) || 'system');
  };

  const themeOptions: {
    id: ThemeOption;
    title: string;
    description: string;
    icon: typeof Sun;
    gradient: string;
    iconBg: string;
  }[] = [
    {
      id: 'light',
      title: 'Light Mode',
      description: 'Clean and bright interface for daytime use',
      icon: Sun,
      gradient: 'bg-gradient-to-b from-[#FFF7ED] to-[#FED7AA]',
      iconBg: 'bg-white',
    },
    {
      id: 'dark',
      title: 'Dark Mode',
      description: 'Easy on the eyes in low light conditions',
      icon: Moon,
      gradient: 'bg-gradient-to-b from-[#1F2937] to-[#111827]',
      iconBg: 'bg-[#374151]',
    },
    {
      id: 'system',
      title: 'Auto (System)',
      description: 'Automatically adapts to your system settings',
      icon: Monitor,
      gradient: 'bg-gradient-to-b from-[#9CA3AF] to-[#6B7280]',
      iconBg: 'bg-[#D1D5DB]',
    },
  ];

  return (
    <div className="min-h-screen dark:bg-background p-6">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Appearance - Customize how the admin portal looks and feels
        </p>
      </div>

      {/* Theme Preference Card */}
      <div className="bg-white dark:bg-card rounded-2xl p-6 border border-border/40 mb-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-[#FE6603] flex items-center justify-center">
            <Palette className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-xl font-medium text-foreground">
            Theme Preference
          </h3>
        </div>

        {/* Theme Options Grid */}
        <div className="grid grid-cols-3 gap-4">
          {themeOptions.map((option) => {
            const isSelected = selectedTheme === option.id;
            const Icon = option.icon;

            return (
              <div key={option.id} className="flex flex-col space-y-2">
                {/* Theme Preview Card (Button) */}
                <button
                  onClick={() => setSelectedTheme(option.id)}
                  className={cn(
                    'relative rounded-xl overflow-hidden transition-all duration-200 text-left border-2',
                    isSelected
                      ? 'border-[#F97316] shadow-sm'
                      : 'border-border hover:border-border/60'
                  )}
                >
                  {/* Preview Content with Gradient */}
                  <div
                    className={cn(
                      'h-32 relative p-3 flex flex-col justify-between',
                      option.gradient
                    )}
                  >
                    {/* Top Row: Icon + Checkmark */}
                    <div className="flex justify-between items-start">
                      {/* Icon */}
                      <div
                        className={cn(
                          'w-8 h-8 rounded-lg flex items-center justify-center',
                          option.iconBg
                        )}
                      >
                        <Icon
                          className={cn(
                            'w-4 h-4',
                            option.id === 'dark' ? 'text-white' : 'text-gray-600'
                          )}
                        />
                      </div>

                      {/* Selected Checkmark */}
                      {isSelected && (
                        <div className="w-6 h-6 rounded-full bg-[#F97316] flex items-center justify-center">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </div>

                    {/* Preview Lines at Bottom */}
                    <div className="space-y-1.5 mb-2">
                      <div
                        className={cn(
                          'h-1.5 rounded-full w-full',
                          option.id === 'light'
                            ? 'bg-[#E5E7EB]'
                            : option.id === 'dark'
                            ? 'bg-[#374151]'
                            : 'bg-[#9CA3AF]'
                        )}
                      />
                      <div
                        className={cn(
                          'h-1.5 rounded-full w-3/4',
                          option.id === 'light'
                            ? 'bg-[#E5E7EB]'
                            : option.id === 'dark'
                            ? 'bg-[#374151]'
                            : 'bg-[#9CA3AF]'
                        )}
                      />
                    </div>
                  </div>
                </button>

                {/* Theme Label (Outside Button) */}
                <div className="space-y-0.5">
                  <h4 className="font-normal text-foreground text-base">
                    {option.title}
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    {option.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Action Buttons (Aligned Right) */}
      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={handleCancel}
          className="px-8 border-border/60"
        >
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          disabled={selectedTheme === theme}
          className="bg-[#F97316] hover:bg-[#EA580C] text-white px-8"
        >
          Save Preferences
        </Button>
      </div>
    </div>
  );
};

export default Appearance;