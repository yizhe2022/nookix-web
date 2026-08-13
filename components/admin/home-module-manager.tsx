"use client";
/**
 * 首页模块管理器
 * 用于配置首页模块的类型、顺序和设置
 */


import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Save, Trash2, GripVertical, Eye, EyeOff } from "lucide-react";
import { HomeModuleConfig, HomeModuleType } from "@/lib/types";
import pb from "@/lib/pocketbase";
import { useToast } from "@/components/ui/use-toast";

const MODULE_TYPES: { value: HomeModuleType; label: string }[] = [
  { value: 'booklist', label: '书本区块' },
  { value: 'series_section', label: '系列区块' },

  { value: 'ad_section', label: '广告区块' },
  { value: 'premium_section', label: '会员区块' },
  { value: 'custom_section', label: '自定义内容' },
  { value: 'recommend_section', label: '推荐书籍' }
];

export default function HomeModuleManager() {
  const [modules, setModules] = useState<HomeModuleConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchModules();
  }, []);

  const fetchModules = async () => {
    try {
      const records = await pb.collection('home_modules').getList<HomeModuleConfig>(1, 50, {
        sort: 'sort_order'
      });

      // 处理config字段的JSON解析
      const modules = records.items.map(item => {
        let config;
        try {
          // 如果config是字符串，解析为JSON对象
          config = typeof item.config === 'string' ? JSON.parse(item.config) : item.config;
        } catch (error) {
          console.error('Failed to parse config for module:', item.id, error);
          // 如果解析失败，使用空配置对象
          config = {};
        }

        return {
          ...item,
          config
        };
      });

      setModules(modules);
    } catch (error) {
      console.error('Failed to fetch modules:', error);
      toast({
        title: "获取失败",
        description: "无法获取首页模块配置",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveModules = async () => {
    setSaving(true);
    try {
      // 更新每个模块的配置
      for (const module of modules) {
        if (module.id && module.id.startsWith('temp_')) {
          // 新建模块
          await pb.collection('home_modules').create({
            title: module.title,
            module_type: module.module_type,
            sort_order: module.sort_order,
            is_enabled: module.is_enabled,
            config: JSON.stringify(module.config)
          });
        } else {
          // 更新现有模块
          await pb.collection('home_modules').update(module.id, {
            title: module.title,
            module_type: module.module_type,
            sort_order: module.sort_order,
            is_enabled: module.is_enabled,
            config: JSON.stringify(module.config)
          });
        }
      }

      await fetchModules(); // 重新获取数据
      toast({
        title: "保存成功",
        description: "首页模块配置已更新",
      });
    } catch (error) {
      console.error('Failed to save modules:', error);
      toast({
        title: "保存失败",
        description: "无法保存首页模块配置",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const addModule = () => {
    const newModule: HomeModuleConfig = {
      id: `temp_${Date.now()}`,
      title: '新模块',
      module_type: 'booklist',
      sort_order: modules.length + 1,
      is_enabled: true,
      config: {
        subtitle: '',
        show_more: true
      },
      collectionId: '',
      collectionName: 'home_modules',
      created: '',
      updated: ''
    };
    setModules([...modules, newModule]);
  };

  const deleteModule = async (moduleId: string) => {
    try {
      if (!moduleId.startsWith('temp_')) {
        await pb.collection('home_modules').delete(moduleId);
      }
      setModules(modules.filter(m => m.id !== moduleId));
      toast({
        title: "删除成功",
        description: "模块已删除",
      });
    } catch (error) {
      console.error('Failed to delete module:', error);
      toast({
        title: "删除失败",
        description: "无法删除模块",
        variant: "destructive",
      });
    }
  };

  const updateModule = (moduleId: string, updates: Partial<HomeModuleConfig>) => {
    setModules(modules.map(m =>
      m.id === moduleId ? { ...m, ...updates } : m
    ));
  };

  const moveModule = (moduleId: string, direction: 'up' | 'down') => {
    const currentIndex = modules.findIndex(m => m.id === moduleId);
    if (currentIndex === -1) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= modules.length) return;

    const newModules = [...modules];
    [newModules[currentIndex], newModules[newIndex]] = [newModules[newIndex], newModules[currentIndex]];

    // 更新排序号
    newModules.forEach((module, index) => {
      module.sort_order = index + 1;
    });

    setModules(newModules);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>首页模块管理</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          首页模块管理
          <div className="flex gap-2">
            <Button onClick={addModule} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              添加模块
            </Button>
            <Button onClick={saveModules} disabled={saving} size="sm">
              <Save className="w-4 h-4 mr-2" />
              {saving ? '保存中...' : '保存配置'}
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {modules.map((module, index) => (
            <ModuleConfigCard
              key={module.id}
              module={module}
              index={index}
              onUpdate={(updates) => updateModule(module.id, updates)}
              onDelete={() => deleteModule(module.id)}
              onMove={(direction) => moveModule(module.id, direction)}
              canMoveUp={index > 0}
              canMoveDown={index < modules.length - 1}
            />
          ))}

          {modules.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              没有配置任何模块，点击"添加模块"开始配置
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface ModuleConfigCardProps {
  module: HomeModuleConfig;
  index: number;
  onUpdate: (updates: Partial<HomeModuleConfig>) => void;
  onDelete: () => void;
  onMove: (direction: 'up' | 'down') => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
}

function ModuleConfigCard({ module, index, onUpdate, onDelete, onMove, canMoveUp, canMoveDown }: ModuleConfigCardProps) {
  const moduleTypeLabel = MODULE_TYPES.find(t => t.value === module.module_type)?.label || module.module_type;

  return (
    <Card className="border border-gray-200">
      <CardContent className="p-4">
        <div className="flex items-center gap-4 mb-4">
          <div className="flex flex-col gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onMove('up')}
              disabled={!canMoveUp}
              className="h-6 w-6 p-0"
            >
              ↑
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onMove('down')}
              disabled={!canMoveDown}
              className="h-6 w-6 p-0"
            >
              ↓
            </Button>
          </div>

          <GripVertical className="w-4 h-4 text-gray-400" />

          <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label className="text-xs">模块标题</Label>
              <Input
                value={module.title}
                onChange={(e) => onUpdate({ title: e.target.value })}
                placeholder="模块标题"
                className="h-8"
              />
            </div>

            <div>
              <Label className="text-xs">模块类型</Label>
              <Select value={module.module_type} onValueChange={(value: HomeModuleType) => onUpdate({ module_type: value })}>
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MODULE_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs">排序</Label>
              <Input
                type="number"
                value={module.sort_order}
                onChange={(e) => onUpdate({ sort_order: parseInt(e.target.value) || 0 })}
                className="h-8"
              />
            </div>

            <div className="flex items-center gap-2">
              <Switch
                checked={module.is_enabled}
                onCheckedChange={(checked) => onUpdate({ is_enabled: checked })}
              />
              <Label className="text-xs">
                {module.is_enabled ? '启用' : '禁用'}
              </Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={onDelete}
                className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* 模块特定配置 */}
        <ModuleSpecificConfig module={module} onUpdate={onUpdate} />
      </CardContent>
    </Card>
  );
}

interface ModuleSpecificConfigProps {
  module: HomeModuleConfig;
  onUpdate: (updates: Partial<HomeModuleConfig>) => void;
}

function ModuleSpecificConfig({ module, onUpdate }: ModuleSpecificConfigProps) {
  const updateConfig = (configUpdates: Partial<HomeModuleConfig['config']>) => {
    onUpdate({
      config: { ...module.config, ...configUpdates }
    });
  };

  const commonConfig = (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
      <div>
        <Label className="text-xs">副标题</Label>
        <Input
          value={module.config?.subtitle || ''}
          onChange={(e) => updateConfig({ subtitle: e.target.value })}
          placeholder="副标题"
          className="h-8"
        />
      </div>
      <div>
        <Label className="text-xs">背景颜色</Label>
        <Input
          value={module.config?.background_color || '#fafbfc'}
          onChange={(e) => updateConfig({ background_color: e.target.value })}
          placeholder="#fafbfc"
          className="h-8"
        />
      </div>
      <div className="flex items-center gap-2">
        <Switch
          checked={module.config?.show_more ?? true}
          onCheckedChange={(checked) => updateConfig({ show_more: checked })}
        />
        <Label className="text-xs">显示"更多"按钮</Label>
      </div>
    </div>
  );

  switch (module.module_type) {
    case 'booklist':
      return (
        <div>
          {commonConfig}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label className="text-xs">布局</Label>
              <Select value={module.config?.layout || 'grid'} onValueChange={(value) => updateConfig({ layout: value as any })}>
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="grid">网格</SelectItem>
                  <SelectItem value="list">列表</SelectItem>
                  <SelectItem value="audio">音频</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Section ID</Label>
              <Input
                value={module.config?.section_id || ''}
                onChange={(e) => updateConfig({ section_id: e.target.value })}
                placeholder="section-id"
                className="h-8"
              />
            </div>
            <div>
              <Label className="text-xs">最大项目数</Label>
              <Input
                type="number"
                value={module.config?.max_items || ''}
                onChange={(e) => updateConfig({ max_items: parseInt(e.target.value) || undefined })}
                placeholder="15"
                className="h-8"
              />
            </div>
            <div>
              <Label className="text-xs">书本过滤器</Label>
              <Input
                value={module.config?.book_filter || ''}
                onChange={(e) => updateConfig({ book_filter: e.target.value })}
                placeholder='sort: "-created"'
                className="h-8"
              />
            </div>
          </div>
        </div>
      );

    case 'series_section':
      return (
        <div>
          {commonConfig}
          <div>
            <Label className="text-xs">系列过滤器</Label>
            <Input
              value={module.config?.series_filter || ''}
              onChange={(e) => updateConfig({ series_filter: e.target.value })}
              placeholder='sort: "-created"'
              className="h-8"
            />
          </div>
        </div>
      );



    case 'ad_section':
      return (
        <div>
          {commonConfig}
          <div className="text-xs text-gray-500 mb-4">
            广告区块展示3个并排图片，可在PocketBase中配置具体的图片和链接。
          </div>
        </div>
      );

    case 'premium_section':
      return (
        <div>
          {commonConfig}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs">会员内容</Label>
              <Textarea
                placeholder="Get unlimited access to thousands of audiobooks and exclusive content..."
                value={module.config?.premium_content || ''}
                onChange={(e) => updateConfig({ premium_content: e.target.value })}
              />
            </div>
            <div>
              <Label className="text-xs">会员链接</Label>
              <Input
                value={module.config?.premium_link || ''}
                onChange={(e) => updateConfig({ premium_link: e.target.value })}
                placeholder="/premium"
                className="h-8"
              />
            </div>
          </div>
        </div>
      );

    case 'custom_section':
      return (
        <div>
          {commonConfig}
          <div>
            <Label className="text-xs">自定义HTML内容</Label>
            <Textarea
              value={module.config?.custom_html || ''}
              onChange={(e) => updateConfig({ custom_html: e.target.value })}
              placeholder="<p>自定义HTML内容...</p>"
              className="h-32"
            />
          </div>
        </div>
      );

    default:
      return <div className="text-xs text-gray-500">未知模块类型</div>;
  }
} 