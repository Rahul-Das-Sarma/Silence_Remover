import React from "react";
import { Check, Zap, Crown } from "lucide-react";

interface PricingCardProps {
  title: string;
  price: string;
  description: string;
  features: string[];
  isPopular?: boolean;
  isPremium?: boolean;
  onSelect: () => void;
  disabled?: boolean;
}

const PricingCard: React.FC<PricingCardProps> = ({
  title,
  price,
  description,
  features,
  isPopular = false,
  isPremium = false,
  onSelect,
  disabled = false,
}) => {
  const Icon = isPremium ? Crown : Zap;

  return (
    <div
      className={`
      relative bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border-2 transition-all duration-200
      ${
        isPopular
          ? "border-indigo-500 ring-2 ring-indigo-200 dark:ring-indigo-800"
          : "border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-600"
      }
      ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
    `}
    >
      {isPopular && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <span className="bg-indigo-500 text-white px-3 py-1 rounded-full text-sm font-medium">
            Most Popular
          </span>
        </div>
      )}

      <div className="text-center mb-6">
        <div className="flex justify-center mb-4">
          <div
            className={`
            p-3 rounded-full
            ${
              isPremium
                ? "bg-yellow-100 dark:bg-yellow-900/20"
                : "bg-blue-100 dark:bg-blue-900/20"
            }
          `}
          >
            <Icon
              className={`
              w-8 h-8
              ${
                isPremium
                  ? "text-yellow-600 dark:text-yellow-400"
                  : "text-blue-600 dark:text-blue-400"
              }
            `}
            />
          </div>
        </div>

        <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
          {title}
        </h3>

        <div className="mb-2">
          <span className="text-3xl font-bold text-gray-800 dark:text-white">
            {price}
          </span>
        </div>

        <p className="text-gray-600 dark:text-gray-400 text-sm">
          {description}
        </p>
      </div>

      <ul className="space-y-3 mb-6">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start space-x-3">
            <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
            <span className="text-gray-700 dark:text-gray-300 text-sm">
              {feature}
            </span>
          </li>
        ))}
      </ul>

      <button
        onClick={onSelect}
        disabled={disabled}
        className={`
          w-full py-3 px-4 rounded-lg font-medium transition-colors
          ${
            isPopular
              ? "bg-indigo-600 hover:bg-indigo-700 text-white"
              : "bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-white"
          }
          ${disabled ? "opacity-50 cursor-not-allowed" : ""}
        `}
      >
        {disabled ? "Not Available" : "Select Plan"}
      </button>
    </div>
  );
};

export default PricingCard;
