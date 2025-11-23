const API_BASE_URL = "https://api.mouldmarket.in/api" // Updated to match backend port
import axios from 'axios';

export const fetchCategories = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/category/all`, {
      credentials: "include", // Include cookies for authentication
    })
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    const data = await response.json()
    return data
  } catch (error) {
    console.error("Error fetching categories:", error)
    throw error
  }
}

export const addProduct = async (formData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/product/add`, {
      method: "POST",
      body: formData, // FormData will automatically set Content-Type: multipart/form-data
      credentials: "include", // Include cookies for authentication
    })

    if (!response.ok) {
  const errorData = await response.json()
  throw new Error(errorData.error || errorData.message || `HTTP error! status: ${response.status}`)
}
    return await response.json()
  } catch (error) {
    console.error("Error adding product:", error)
    throw error
  }
}

export const duplicateProducts = async (productIds) => {
  try {
    const response = await fetch(`${API_BASE_URL}/product/duplicate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ productIds }),
      credentials: "include",
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error duplicating products:", error);
    throw error;
  }
};

// Fetch company settings
export const fetchCompanySettings = async () => {
  const response = await axios.get('https://api.mouldmarket.in/api/company-settings/', {withCredentials: true})
  return response.data.data
}
