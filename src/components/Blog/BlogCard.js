import React from "react";
import { Link } from "react-router-dom";
import {
  Card,
  CardMedia,
  CardContent,
  Typography,
  Chip,
  Avatar,
} from "@mui/material";
import {
  Visibility as VisibilityIcon,
  Schedule as ScheduleIcon,
  Person as PersonIcon,
} from "@mui/icons-material";

const BlogCard = ({ blog }) => {
  console.log(" BlogCard ~ blog:", blog);
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const stripHtml = (html) => {
    const doc = new DOMParser().parseFromString(html, "text/html");
    return doc.body.textContent || "";
  };

  return (
    <Card className="h-full rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform group-hover:scale-[1.02] cursor-pointer group flex flex-col">
      <Link
        to={`/blog/${blog.slug}`}
        className="no-underline flex flex-col h-full"
      >
        {/* Image */}
        <CardMedia
          component="img"
          height="200"
          image={blog.imgUrl || "/images/blog-placeholder.jpg"}
          alt={blog.title?.text || blog.title}
          className="h-48 object-cover group-hover:scale-105 transition-transform duration-300 flex-shrink-0"
        />

        <CardContent className="p-4 flex flex-col flex-grow">
          {/* Main content that will grow */}
          <div className="flex-grow">
            {/* Category and Date */}
            <div className="flex justify-between items-center mb-3">
              <Chip
                label={blog.category}
                size="small"
                color="primary"
                variant="outlined"
              />
              <div className="flex items-center text-gray-500 text-sm">
                <ScheduleIcon className="w-4 h-4 mr-1" />
                {formatDate(blog.publishedAt || blog.createdAt)}
              </div>
            </div>

            {/* Title */}
            <Typography
              variant="h6"
              component="h3"
              className="font-bold text-gray-800 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors"
            >
              {blog.title?.text || blog.title}
            </Typography>

            {/* Excerpt */}
            <Typography
              variant="body2"
              color="textSecondary"
              className="mb-3 line-clamp-3"
            >
              {stripHtml(blog.excerpt)}
            </Typography>

            {/* Tags */}
            {blog.tags && blog.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-3">
                {blog.tags.slice(0, 3).map((tag, index) => (
                  <Chip
                    key={index}
                    label={tag}
                    size="small"
                    variant="outlined"
                    className="text-xs"
                  />
                ))}
                {blog.tags.length > 3 && (
                  <Typography variant="caption" color="textSecondary">
                    +{blog.tags.length - 3}
                  </Typography>
                )}
              </div>
            )}
          </div>

          {/* Footer: Author and Views - Always at bottom */}
          <div className="flex justify-between items-center mt-4 pt-3 border-t border-gray-100 min-h-[32px] flex-shrink-0">
            <div className="flex items-center h-full">
              <Avatar
                src={blog.author?.avatar}
                className="w-6 h-6 mr-2 flex-shrink-0"
              >
                <PersonIcon className="w-4 h-4" />
              </Avatar>
              <Typography
                variant="caption"
                color="textSecondary"
                className="leading-6"
              >
                {blog.author?.fullName || "Admin"}
              </Typography>
            </div>

            <div className="flex items-center text-gray-500 h-full">
              <VisibilityIcon className="w-4 h-4 mr-1 flex-shrink-0" />
              <Typography variant="caption" className="leading-6">
                {blog.views || 0} lượt xem
              </Typography>
            </div>
          </div>
        </CardContent>
      </Link>
    </Card>
  );
};

export default BlogCard;
