import { List, Grid, ArrowUpDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { ViewMode, SortBy } from '@/types'

interface ViewToggleProps {
  viewMode: ViewMode
  onViewChange: (mode: ViewMode) => void
  sortBy: SortBy
  onSortChange: (sort: SortBy) => void
}

const sortOptions = [
  { value: 'modified' as SortBy, label: '最后修改时间' },
  { value: 'created' as SortBy, label: '创建时间' },
  { value: 'name' as SortBy, label: '名称' },
]

export function ViewToggle({ viewMode, onViewChange, sortBy, onSortChange }: ViewToggleProps) {
  return (
    <div className="flex items-center gap-2">
      {/* Sort Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <ArrowUpDown className="h-4 w-4" />
            <span className="hidden sm:inline">
              {sortOptions.find((opt) => opt.value === sortBy)?.label || '排序'}
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {sortOptions.map((option) => (
            <DropdownMenuItem
              key={option.value}
              onClick={() => onSortChange(option.value)}
            >
              {option.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* View Toggle */}
      <div className="flex rounded-lg border border-border">
        <Button
          variant={viewMode === 'list' ? 'secondary' : 'ghost'}
          size="sm"
          className="rounded-r-none"
          onClick={() => onViewChange('list')}
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
          size="sm"
          className="rounded-l-none"
          onClick={() => onViewChange('grid')}
        >
          <Grid className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
