import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Typography,
  Grid,
  Card,
  CardMedia,
  CardContent,
  Chip,
  Box,
  Skeleton,
} from "@mui/material";
import {
  Schedule as ScheduleIcon,
  Visibility as VisibilityIcon,
} from "@mui/icons-material";
import { getPublishedBlogs } from "../../services/BlogService";

const RelatedBlogs = ({ currentBlog, maxItems = 3 }) => {
  const [relatedBlogs, setRelatedBlogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentBlog) {
      fetchRelatedBlogs();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentBlog]);

  const fetchRelatedBlogs = async () => {
    try {
      setLoading(true);

      // Fetch blogs from same category
      const response = await getPublishedBlogs(
        1,
        maxItems + 2,
        currentBlog.category
      );

      if (response && response.data) {
        // Filter out current blog and limit results
        const filtered = response.data
          .filter((blog) => blog._id !== currentBlog._id)
          .slice(0, maxItems);

        setRelatedBlogs(filtered);
      }
    } catch (error) {
      console.error("Error fetching related blogs:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const stripHtml = (html) => {
    if (!html) return "";

    // First strip LaTeX formulas to avoid rendering them as text
    let cleanHtml = html.replace(/\$\$[\s\S]*?\$\$/g, " [Công thức toán] ");
    cleanHtml = cleanHtml.replace(/\$[^$]+\$/g, " [Công thức] ");

    // Then strip HTML tags
    const doc = new DOMParser().parseFromString(cleanHtml, "text/html");
    return doc.body.textContent || "";
  };

  if (loading) {
    return (
      <Box className="mt-12">
        <Typography variant="h5" className="font-bold mb-6">
          Bài viết liên quan
        </Typography>
        <Grid container spacing={3}>
          {Array.from({ length: maxItems }, (_, index) => (
            <Grid item xs={12} md={4} key={index}>
              <Card>
                <Skeleton variant="rectangular" height={160} />
                <CardContent>
                  <Skeleton variant="text" height={24} width="80%" />
                  <Skeleton
                    variant="text"
                    height={16}
                    width="60%"
                    className="mt-2"
                  />
                  <Skeleton variant="text" height={60} className="mt-2" />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  if (relatedBlogs.length === 0) {
    return null;
  }

  return (
    <Box className="mt-12">
      <Typography variant="h5" className="font-bold mb-6 text-gray-800">
        Bài viết liên quan
      </Typography>
      <Grid container spacing={3}>
        {relatedBlogs.map((blog) => (
          <Grid item xs={12} md={4} key={blog._id}>
            <Card className="h-full rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform group-hover:scale-[1.02] cursor-pointer group flex flex-col">
              <Link
                to={`/blog/${blog.slug}`}
                className="no-underline flex flex-col h-full"
              >
                {/* Image */}
                <CardMedia
                  component="img"
                  height="160"
                  image={blog.imgUrl || "/images/blog-placeholder.jpg"}
                  alt={blog.title?.text || blog.title}
                  className="h-40 object-cover group-hover:scale-105 transition-transform duration-300 flex-shrink-0"
                />

                <CardContent className="p-4 flex flex-col flex-grow">
                  {/* Main content that will grow */}
                  <div className="flex-grow">
                    {/* Category and Date */}
                    <div className="flex justify-between items-center mb-2">
                      <Chip
                        label={blog.category}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                      <div className="flex items-center text-gray-500 text-xs">
                        <ScheduleIcon className="w-3 h-3 mr-1" />
                        {formatDate(blog.publishedAt || blog.createdAt)}
                      </div>
                    </div>

                    {/* Title */}
                    <Typography
                      variant="h6"
                      component="h3"
                      className="font-bold text-gray-800 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors text-sm"
                    >
                      {blog.title?.text || blog.title}
                    </Typography>

                    {/* Excerpt */}
                    <Typography
                      variant="body2"
                      color="textSecondary"
                      className="mb-3 line-clamp-3 text-xs"
                    >
                      {stripHtml(blog.excerpt)}
                    </Typography>
                  </div>

                  {/* Footer: Views - Always at bottom */}
                  <div className="flex justify-between items-center mt-3 pt-2 border-t border-gray-100 flex-shrink-0 min-h-[28px]">
                    <div className="flex items-center text-gray-500 h-full">
                      <VisibilityIcon className="w-3 h-3 mr-1 flex-shrink-0" />
                      <Typography variant="caption" className="leading-5">
                        {blog.views || 0} lượt xem
                      </Typography>
                    </div>

                    <Typography
                      variant="caption"
                      className="text-blue-500 group-hover:text-blue-700 transition-colors font-medium leading-5"
                    >
                      Đọc tiếp →
                    </Typography>
                  </div>
                </CardContent>
              </Link>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default RelatedBlogs;
