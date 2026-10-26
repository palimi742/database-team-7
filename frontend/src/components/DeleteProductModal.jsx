import "../css/ProductModal.css";
import { useState } from "react"

function DeleteProductModal({ product, onClose, onSaved }) {
    const [deleting, setDeleting] = useState(false)
    const [error, setError] = useState("")
    
    async function handleDelete(){
        setError("")
        setDeleting(true)

        try{
            const res = await fetch(`/api/products/${product.InventoryID}/delete`,
                {method: "PATCH"}
            )
            const data = await res.json()
            if(!res.ok){
                throw new Error(data.message)
            }
            await onSaved()
            onClose()
        }catch(err){
            setError(err.message)
        }finally{
            setDeleting(false)
        }
    }
  return (
    <div className="modal-overlay">
      <div className="product-modal">
        <h2>Confirm Delete</h2>
        <p>Are you sure you want to delete {product.InventoryName}?</p>

        <p>This product will become inactive.</p>
        {error && <p>{error}</p>}
        <button type="button" onClick={onClose} disabled={deleting}>
          Cancel
        </button>
        <button type="button" onClick={handleDelete} disabled={deleting}>
          {deleting ? "Deleting..." : "Delete Product"}
        </button>
      </div>
    </div>
  );
}

export default DeleteProductModal