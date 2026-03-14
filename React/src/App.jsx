import { useEffect, useRef, useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./App.css";

// Components
import Items from "./components/Items";
import Form from "./components/Form";

// Default API (used when VITE_API_BASE_URL is not set)
const DEFAULT_BASE_URL = "https://grocery-bud-rest.vercel.app/api/grocery";

const stripTrailingSlashes = (value) => String(value ?? "").replace(/\/+$/, "");

const BASE_URL = stripTrailingSlashes(
  import.meta.env.VITE_API_BASE_URL ?? DEFAULT_BASE_URL,
);

const parseResponseBody = async (res) => {
  const text = await res.text();
  if (!text) return null;

  const contentType = res.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return text;

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
};

const unwrapData = (payload) =>
  payload && typeof payload === "object" && "data" in payload
    ? payload.data
    : payload;

const getErrorMessage = (body, status) => {
  if (typeof body === "string") {
    const normalized = body.trim();
    const lower = normalized.toLowerCase();

    if (lower.includes("attempt to write a readonly database")) {
      return "Server is read-only (database is readonly). Use a writable API or run the backend locally.";
    }

    if (lower.includes("<!doctype html") || lower.includes("<html")) {
      return `Request failed (${status})`;
    }

    return normalized.length > 200 ? `${normalized.slice(0, 200)}…` : normalized;
  }

  return body?.detail || body?.message || `Request failed (${status})`;
};

const requestJson = async (url, options) => {
  const res = await fetch(url, options);
  const body = await parseResponseBody(res);

  if (!res.ok) {
    throw new Error(getErrorMessage(body, res.status));
  }

  return body;
};

const App = () => {
  const [items, setItems] = useState([]);
  const [editId, setEditId] = useState(null);
  const inputRef = useRef(null);

  // 1. GET ALL ITEMS (Read)
  const fetchItems = async () => {
    try {
      const data = await requestJson(`${BASE_URL}/`);
      setItems(Array.isArray(data) ? data : unwrapData(data) ?? []);
    } catch (err) {
      toast.error(err?.message || "Could not load grocery list from server");
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  // Handle focus when editing
  useEffect(() => {
    if (editId && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editId]);

  // 2. ADD ITEM (Create)
  const addItem = async (itemName) => {
    try {
      const createdPayload = await requestJson(`${BASE_URL}/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: itemName, completed: false }),
      });

      const newItem = unwrapData(createdPayload);
      if (!newItem || typeof newItem !== "object") {
        await fetchItems();
        return;
      }

      setItems((prev) => [...prev, newItem]);
      toast.success("Item added successfully");
    } catch (err) {
      toast.error(err?.message || "Failed to add item");
    }
  };

  // 3. UPDATE ITEM NAME (Update)
  const updateItemName = async (newName) => {
    try {
      const updatedPayload = await requestJson(`${BASE_URL}/${editId}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName }),
      });

      const updated = unwrapData(updatedPayload);
      setItems((prev) =>
        prev.map((item) => (item.id === editId ? updated : item)),
      );
      setEditId(null);
      toast.success("Item updated");
    } catch (err) {
      toast.error(err?.message || "Could not update item");
    }
  };

  // 4. TOGGLE COMPLETED (Special Action)
  const editCompleted = async (itemId) => {
    try {
      const updatedPayload = await requestJson(`${BASE_URL}/${itemId}/toggle/`, {
        method: "POST",
      });

      const updated = unwrapData(updatedPayload);
      setItems((prev) =>
        prev.map((item) => (item.id === itemId ? updated : item)),
      );
    } catch (err) {
      toast.error(err?.message || "Update failed");
    }
  };

  // 5. REMOVE ITEM (Delete)
  const removeItem = async (itemId) => {
    try {
      await requestJson(`${BASE_URL}/${itemId}/`, {
        method: "DELETE",
      });

      setItems((prev) => prev.filter((item) => item.id !== itemId));
      toast.success("Item removed");
    } catch (err) {
      toast.error(err?.message || "Could not delete item");
    }
  };

  return (
    <section className="section-center">
      <ToastContainer position="top-center" autoClose={2000} />
      <Form
        addItem={addItem}
        updateItemName={updateItemName}
        editItemId={editId}
        itemToEdit={items.find((item) => item.id === editId)}
        inputRef={inputRef}
      />
      <Items
        items={items}
        editCompleted={editCompleted}
        removeItem={removeItem}
        setEditId={setEditId}
      />
    </section>
  );
};

export default App;