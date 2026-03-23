import React, { useState, useEffect } from "react";
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  TextField,
  MenuItem,
  InputAdornment,
  Box,
  Chip,
  Button,
  Skeleton,
} from "@mui/material";
import {
  Search as SearchIcon,
  Article as ArticleIcon,
  Category as CategoryIcon,
} from "@mui/icons-material";
import { Link, useLocation, useNavigate } from "react-router-dom";
import BlogCard from "./BlogCard";
import PaginationCustom from "../PaginationCustom";
import {
  getPublishedBlogs,
  getBlogCategories,
} from "../../services/BlogService";
import { toast } from "react-toastify";
import { DeleteIcon, OctagonX } from "lucide-react";

const BlogsPage = () => {
  const [blogs, setBlogs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedTag, setSelectedTag] = useState("");

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    // Parse URL params
    const urlParams = new URLSearchParams(location.search);
    const page = parseInt(urlParams.get("page")) || 1;
    const category = urlParams.get("category") || "";
    const tag = urlParams.get("tag") || "";
    const query = urlParams.get("query") || "";

    setCurrentPage(page);
    setSelectedCategory(category);
    setSelectedTag(tag);
    setSearchQuery(query);
    setSearchInput(query);

    fetchBlogs(page, category, tag, query);
  }, [location.search, fetchBlogs]);

  // Debounce search input
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchInput !== searchQuery) {
        updateURL({
          page: 1,
          category: selectedCategory,
          tag: selectedTag,
          query: searchInput,
        });
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchInput, searchQuery, selectedCategory, selectedTag, updateURL]);

  const fetchCategories = async () => {
    try {
      const response = await getBlogCategories();
      if (response && response.data) {
        setCategories(response.data);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const fetchBlogs = async (page = 1, category = "", tag = "", query = "") => {
    try {
      setLoading(true);
      const response = await getPublishedBlogs(page, 9, category, tag, query);
      console.log(" fetchBlogs ~ response:", response);

      if (response && response.data) {
        setBlogs(response.data);
        setTotalPages(response.totalPages || 1);
      }
    } catch (error) {
      console.error("Error fetching blogs:", error);
      toast.error("Lỗi khi tải danh sách bài viết");
    } finally {
      setLoading(false);
    }
  };

  const handleChangePage = (page) => {
    console.log("handleChangePage called with page:", page);
    updateURL({
      page,
      category: selectedCategory,
      tag: selectedTag,
      query: searchQuery,
    });
  };

  const handleNextPage = () => {
    console.log(
      "handleNextPage called, currentPage:",
      currentPage,
      "totalPages:",
      totalPages
    );
    if (currentPage < totalPages) {
      const nextPage = currentPage + 1;
      updateURL({
        page: nextPage,
        category: selectedCategory,
        tag: selectedTag,
        query: searchQuery,
      });
    }
  };

  const handlePrevPage = () => {
    console.log("handlePrevPage called, currentPage:", currentPage);
    if (currentPage > 1) {
      const prevPage = currentPage - 1;
      updateURL({
        page: prevPage,
        category: selectedCategory,
        tag: selectedTag,
        query: searchQuery,
      });
    }
  };

  const handleCategoryChange = (event) => {
    const category = event.target.value;
    updateURL({ page: 1, category, tag: selectedTag, query: searchQuery });
  };

  const handleTagClick = (tag) => {
    updateURL({ page: 1, category: selectedCategory, tag, query: searchQuery });
  };

  const handleSearchInputChange = (event) => {
    setSearchInput(event.target.value);
  };

  const clearFilters = () => {
    setSearchInput("");
    updateURL({ page: 1, category: "", tag: "", query: "" });
  };

  const updateURL = ({ page, category, tag, query }) => {
    const params = new URLSearchParams();
    if (page > 1) params.set("page", page);
    if (category) params.set("category", category);
    if (tag) params.set("tag", tag);
    if (query) params.set("query", query);

    const search = params.toString();
    navigate(`/blog${search ? `?${search}` : ""}`);
  };

  const renderSkeletons = () => {
    return Array.from({ length: 6 }, (_, index) => (
      <Grid item xs={12} sm={6} md={4} key={index}>
        <Card>
          <Skeleton variant="rectangular" height={200} />
          <CardContent>
            <Skeleton variant="text" height={30} width="80%" />
            <Skeleton variant="text" height={20} width="60%" />
            <Skeleton variant="text" height={60} />
            <Skeleton variant="text" height={20} width="40%" />
          </CardContent>
        </Card>
      </Grid>
    ));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Breadcrumb */}
        <div className="text-sm text-gray-500 mb-4">
          <Link to="/" className="hover:underline transition-colors">
            Trang chủ
          </Link>{" "}
          / <span className="text-gray-800 font-medium">Bài viết</span>
        </div>
        <div className="flex items-center justify-between mb-6">
          <Container maxWidth="lg">
            {/* Filters */}
            <Card className="mb-6">
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  {/* Search Input */}
                  <TextField
                    label="Tìm kiếm bài viết"
                    value={searchInput}
                    onChange={handleSearchInputChange}
                    variant="outlined"
                    fullWidth
                    placeholder="Nhập từ khóa tìm kiếm..."
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon className="text-gray-400" />
                        </InputAdornment>
                      ),
                    }}
                  />

                  {/* Category Select */}
                  <TextField
                    select
                    label="Danh mục"
                    value={selectedCategory}
                    onChange={handleCategoryChange}
                    variant="outlined"
                    fullWidth
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <CategoryIcon className="text-gray-400" />
                        </InputAdornment>
                      ),
                    }}
                  >
                    <MenuItem value="">Tất cả danh mục</MenuItem>
                    {categories.map((category) => (
                      <MenuItem key={category} value={category}>
                        {category}
                      </MenuItem>
                    ))}
                  </TextField>

                  {/* Clear Filters Button */}
                  {(selectedCategory || selectedTag || searchQuery) && (
                    <Box className="flex items-center">
                      <Button
                        variant="contained"
                        onClick={clearFilters}
                        startIcon={<OctagonX />}
                        className="h-fit"
                      >
                        Xóa bộ lọc
                      </Button>
                    </Box>
                  )}
                </div>

                {/* Active Filters */}
                {(selectedCategory || selectedTag || searchQuery) && (
                  <Box className="flex flex-wrap gap-2">
                    {searchQuery && (
                      <Chip
                        label={`Tìm kiếm: "${searchQuery}"`}
                        onDelete={() => {
                          setSearchInput("");
                          updateURL({
                            page: 1,
                            category: selectedCategory,
                            tag: selectedTag,
                            query: "",
                          });
                        }}
                        color="info"
                        variant="outlined"
                      />
                    )}
                    {selectedCategory && (
                      <Chip
                        label={`Danh mục: ${selectedCategory}`}
                        onDelete={() =>
                          updateURL({
                            page: 1,
                            category: "",
                            tag: selectedTag,
                            query: searchQuery,
                          })
                        }
                        color="primary"
                        variant="outlined"
                      />
                    )}
                    {selectedTag && (
                      <Chip
                        label={`Thẻ: ${selectedTag}`}
                        onDelete={() =>
                          updateURL({
                            page: 1,
                            category: selectedCategory,
                            tag: "",
                            query: searchQuery,
                          })
                        }
                        color="secondary"
                        variant="outlined"
                      />
                    )}
                  </Box>
                )}
              </CardContent>
            </Card>

            {/* Blog Grid */}
            <Grid container spacing={4}>
              {loading ? (
                renderSkeletons()
              ) : blogs.length === 0 ? (
                <Grid item xs={12}>
                  <Card>
                    <CardContent className="text-center py-16">
                      <ArticleIcon className="text-6xl text-gray-300 mb-4" />
                      <Typography variant="h6" color="textSecondary">
                        {searchQuery
                          ? `Không tìm thấy bài viết nào với từ khóa "${searchQuery}"`
                          : "Không tìm thấy bài viết nào"}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="textSecondary"
                        className="mt-2"
                      >
                        {searchQuery || selectedCategory || selectedTag
                          ? "Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc."
                          : "Chưa có bài viết nào được xuất bản."}
                      </Typography>
                      {(selectedCategory || selectedTag || searchQuery) && (
                        <Button
                          variant="contained"
                          onClick={clearFilters}
                          className="mt-4"
                          startIcon={<DeleteIcon />}
                        >
                          Xóa bộ lọc
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              ) : (
                blogs.map((blog) => (
                  <Grid item xs={12} sm={6} md={4} key={blog._id}>
                    <BlogCard blog={blog} onTagClick={handleTagClick} />
                  </Grid>
                ))
              )}
            </Grid>

            {/* Pagination */}
            {totalPages > 1 && (
              <Box className="flex justify-center mt-8">
                <PaginationCustom
                  totalPage={totalPages}
                  currentPage={currentPage}
                  handleChangePage={handleChangePage}
                  handleNextPage={handleNextPage}
                  handlePrevPage={handlePrevPage}
                />
              </Box>
            )}
          </Container>
        </div>
      </div>
    </div>
  );
};

export default BlogsPage;
