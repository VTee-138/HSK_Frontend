import { get } from "../common/apiClient";

const PATH_BLOG = "/blog";

export const getPublishedBlogs = async (
  pageNumber = 1,
  limit = 6,
  category = "",
  tag = "",
  searchQuery = ""
) => {
  let queryString = `?page=${pageNumber}&limit=${limit}`;
  if (category) {
    queryString += `&category=${encodeURIComponent(category)}`;
  }
  if (tag) {
    queryString += `&tag=${encodeURIComponent(tag)}`;
  }
  if (searchQuery) {
    queryString += `&query=${encodeURIComponent(searchQuery)}`;
  }
  return await get(PATH_BLOG + queryString);
};

export const getBlogBySlug = async (slug) => {
  return await get(PATH_BLOG + `/slug/${slug}`);
};

export const getBlogCategories = async () => {
  return await get(PATH_BLOG + "/categories");
};

export const getBlogTags = async () => {
  return await get(PATH_BLOG + "/tags");
};

const blogService = {
  getPublishedBlogs,
  getBlogBySlug,
  getBlogCategories,
  getBlogTags,
};

export default blogService;
