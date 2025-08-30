import { redis } from "../db/redis.js";
import cloudinary from "../utils/cloudinary.js";
import Product from "../models/product.model.js";


export const getAllProducts = async (req, res) => {
    try {
        const products = await Product.find({});
        res.status(200).json({
            success: true,
            products: products,
        })
    } catch (error) {
        console.error(`Error in getAllProducts controller: ${error.message}`);
        res.status(500).json({
            success: false,
            message: `Server error ${error.message}`
        })
    }
};

export const createProduct = async (req, res) => {
    try {
        const { name, description, price, image, categor } = req.body;
        let cloudinaryResponse = null;
        if (image) {
            cloudinaryResponse = await cloudinary.uploader.upload(image, { folder: "products" });
        }

        const product = await Product.create({
            name,
            description,
            price,
            image: cloudinaryResponse?.secure_url ? cloudinaryResponse.secure_url : "",
            category
        });
        res.status(201).json(product);
    } catch (error) {
        console.error(`Error in createProduct controller: ${error.message}`);
        res.status(500).json({ message: `Server error: ${error.message}` });
    }
}

export const getProductsByCategory = async (req, res) => {
    const { category } = req.params;
    try {
        const products = await Product.find({ category })
        res.status(200).json({
            success: true,
            products: products
        });
    } catch (error) {
        console.error(`Error in getProductsByCategory controller: ${error.message}`);
        res.status(500).json({ message: `Server error: ${error.message}` });
    }
}

export const deleteProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product)
            res.status(404).json({ success: false, message: "Product not found" });

        if (product.image) {
            const productId = product.image.split("/").pop().split(".")[0];
            try {
                await cloudinary.uploader.destroy(`product/${productId}`);
                console.log("deleted image from cloudinary");
            } catch (error) {
                console.error(`Error in createProduct controller: ${error.message}`);
                res.status(500).json({ message: `cloudinay error: ${error.message}` });
            }

            await Product.findByIdAndDelete(req.params.id);
            res.json({ success: true, message: "Product deleted successffully" });
        }
    } catch (error) {
        console.error(`Error in deleteProduct controller: ${error.message}`);
        res.status(500).json({ message: `Server error: ${error.message}` });
    }
}


export const getFeaturedProducts = async (req, res) => {
    try {
        let featuredProducts = await redis.get("featured_products");
        if (featuredProducts)
            res.status(200).json({ success: true, products: JSON.parse(featuredProducts) });

        // IF not  in redis, fetch from db
        //.lean() is gonna return a plain javascript object instead pf a mondodb document
        // which is good for performance

        featuredProducts = await Product.find({ isFeatured: true }).lean();
        if (!isFeatured)
            return res.status(404).json({ success: false, message: "No feature products found" })

        // store in redis for future quick access
        await redis.set("featured_products", JSON.stringify(featuredProducts));
        res.status(200).json({
            success: true,
            products: featuredProducts
        });
    } catch (error) {
        console.error(`Error in getFeaturedProducts controller: ${error.message}`);
        res.status(500).json({ message: `Server error: ${error.message}` });
    }
}

export const getRecommendedProducts = async (req, res) => {
    try {
        const products = await Product.aggregate([
            {
                $sample: { size: 4 }
            },
            {
                $product: {
                    _id: 1,
                    name: 1,
                    description: 1,
                    image: 1,
                    price: 1
                },
            },
        ]);
        res.status(200).json({
            success: true,
            products: products
        })
    } catch (error) {
        console.error(`Error in getRecommendedProducts controller: ${error.message}`);
        res.status(500).json({ message: `Server error: ${error.message}` });
    }
}
export const toggleFeaturedProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (product) {
            product.isFeatured = !product.isFeatured;
            const updateProduct = await product.save();
            await updateFeaturedProductsCache();
            res.json(200).json({ success: true, product: updateProduct })
        } else {
            res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }
    } catch (error) {
        console.error(`Error in toggleFeaturedProductcontroller: ${error.message}`);
        res.status(500).json({ message: `Server error: ${error.message}` });
    }
}

async function updateFeaturedProductsCache() {
    try {
        const featuredProducts = await Product.find({ isFeatured: true }).lean();
        await redis.set("featured_products", JSON.stringify(featuredProducts))
    } catch (error) {
        console.error(`Error in update cache functon: ${error.message}`);
    }
}