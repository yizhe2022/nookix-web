'use client'

import { Star } from "lucide-react";

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  size?: "sm" | "md" | "lg";
  showValue?: boolean;
  className?: string;
}

/**
 * 星星评分组件 - 支持小数点显示
 * 例如：4.3分会显示4颗完整星星 + 1颗30%填充的星星
 */
export default function StarRating({
  rating,
  maxRating = 5,
  size = "md",
  showValue = true,
  className = "",
}: StarRatingProps) {
  const sizeClasses = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };

  const textSizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  };

  const renderStar = (index: number) => {
    const starValue = index + 1;
    const fillPercentage = Math.max(0, Math.min(100, ((rating || 0) - index) * 100));
    
    return (
      <div key={index} className="relative">
        {/* 背景星星（灰色） */}
        <Star className={`${sizeClasses[size]} text-gray-300 fill-gray-300`} />
        
        {/* 前景星星（黄色，根据百分比裁剪） */}
        {fillPercentage > 0 && (
          <div 
            className="absolute top-0 left-0 overflow-hidden"
            style={{ width: `${fillPercentage}%` }}
          >
            <Star className={`${sizeClasses[size]} text-yellow-400 fill-yellow-400`} />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`flex items-center space-x-1 ${className}`}>
      <div className="flex items-center space-x-0.5">
        {Array.from({ length: maxRating }, (_, index) => renderStar(index))}
      </div>
      {showValue && rating !== undefined && rating !== null && (
        <span className={`${textSizeClasses[size]} text-gray-600 ml-2`}>
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
}