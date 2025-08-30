import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: [true, "Email is required"],
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: [true, "Password is required"],
        minlength: [6, "Password must be at least 6 characters  long"],
    },
    cartItems: [
        {
            quantity: {
                type: Number,
                default: 1
            },
            product: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Product"
            },
        }
    ],
    role: {
        type: String,
        enum: ["customer", "admin"],
        default: "customer"
    },
},
    {
        timestamps: true
    }
);

userSchema.pre("save", async (next) => {
    if (!this.isModified("password")) return next();

    try {
        const salt = await bcrypt.getSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error)
    }
});

userSchema.methods.comparePassword = async (password) => {
    return bcrypt.compare(password, this.password);
};

const User = mongoose.model("User", userSchema);

export default User;