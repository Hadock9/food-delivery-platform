import React from "react";
import { Link } from "react-router-dom";
import { ROUTES } from "../../utils/roleRoutes.js";
import { Star, MapPin, Zap } from "lucide-react";
import { resolveDishImage, handleImageError, dishImgProps } from "../../utils/images.js";
import "./styles/DishCardComponent.css";

const DishCardComponent = ({ dish, isPopular = false }) => {
    const imageSrc = resolveDishImage(dish, dish.category, dish.name, dish.businessId);
    const fallbackSrc = resolveDishImage(null, dish.category, dish.name, dish.businessId);
    const ratingLabel = Number(dish.rating);
    const ratingText = Number.isFinite(ratingLabel) ? ratingLabel.toFixed(1) : "—";

    return (
        <Link to={ROUTES.customer.dish(dish.id)} className={`dish-card ${isPopular ? "popular-card" : ""}`}>
            <div className="image-wrapper">
                <img
                    src={imageSrc}
                    alt={dish.name}
                    {...dishImgProps}
                    onError={(e) => handleImageError(e, fallbackSrc)}
                />
                <div className="rating-badge">
                    <Star size={16} fill="gold" /> {ratingText}
                </div>
                {dish.popular && (
                    <div className="popular-tag">
                        <Zap size={14} /> ХІТ
                    </div>
                )}
            </div>
            <div className="dish-info">
                <h3>{dish.name}</h3>
                <p className="restaurant">
                    <MapPin size={14} /> {dish.restaurant}
                </p>
                <div className="price-tag">{dish.price} ₴</div>
            </div>
        </Link>
    );
};

export default DishCardComponent;
