import { useState } from "react";
import { API } from "../apis/axios.js";

const usePost = (url) =>{
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const post = async (body, config = {}) => {
    setLoading(true);
    setError(null);
    try {
      // FormData일 땐 Content-Type 지정하지 않기
      const res = await API.post(url, body, config);
      return res.data; // { status, data, message }
    } catch (e) {
      setError(e);
      throw e;
    } finally {
      setLoading(false);
    }
  };

  return { post, loading, error };
}

export default usePost;