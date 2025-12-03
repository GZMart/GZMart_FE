// Helper function to generate inventory and variants for products
// Supports shoes (EU sizes), clothing (alpha sizes), and accessories (one size)
const generateInventoryAndVariants = (
  productType,
  baseSku,
  sizes,
  colors,
  basePrice,
  discountPercent,
  totalStock,
  materials = [],
  fits = []
) => {
  const inventory = [];
  const variantArray = []; // For backward compatibility
  const stockPerVariant = Math.floor(totalStock / (sizes.length * colors.length)) || 1;
  let variantIndex = 0;

  sizes.forEach((size) => {
    colors.forEach((color) => {
      // Calculate cost_price (giá vốn) - typically 40-60% of selling price
      const costPrice = basePrice * 0.5;
      // Calculate selling_price - base price with potential discount
      const sellingPrice = basePrice * (1 - discountPercent / 100);
      // Weight in grams (estimated)
      const weight =
        productType === 'shoes'
          ? 800 + Math.random() * 400 // 800-1200g for shoes
          : productType === 'clothing'
            ? 200 + Math.random() * 300 // 200-500g for clothing
            : 100 + Math.random() * 200; // 100-300g for accessories

      // Generate variant SKU
      let sizeCode = 'OS';
      if (productType === 'shoes' && typeof size === 'number') {
        sizeCode = `S${size}`;
      } else if (productType === 'shoes' && typeof size === 'string') {
        // Convert US size to EU if needed (simplified)
        sizeCode = `S${size.replace('US ', '')}`;
      } else if (productType === 'clothing') {
        sizeCode = `C${size}`;
      } else if (productType === 'accessory') {
        sizeCode = 'OS';
      }

      const colorCode = color.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, '');
      const variantSku = `${baseSku}-${sizeCode}-${colorCode}`;

      // Create inventory item based on productType
      const inventoryItem = {
        color,
        quantity: stockPerVariant + (variantIndex % 3),
        isAvailable: true,
        sku: variantSku,
        images: [],
        attrs: {
          material: materials[variantIndex % materials.length] || null,
          fit: fits[variantIndex % fits.length] || null,
        },
      };

      // Add size field based on productType
      if (productType === 'shoes') {
        // Convert US size to EU (simplified conversion)
        const usSize = typeof size === 'string' ? parseInt(size.replace('US ', '')) : size;
        const euSize = usSize + 33; // Approximate conversion
        inventoryItem.size = Math.min(50, Math.max(30, euSize)); // Clamp to EU 30-50
      } else if (productType === 'clothing') {
        inventoryItem.clothingSize = size;
      } else if (productType === 'accessory') {
        inventoryItem.isOneSize = true;
      }

      inventory.push(inventoryItem);

      // For backward compatibility - variant array
      variantArray.push({
        sku_code: variantSku,
        color,
        size,
        stock_quantity: inventoryItem.quantity,
        cost_price: parseFloat(costPrice.toFixed(2)),
        selling_price: parseFloat(sellingPrice.toFixed(2)),
        weight: parseFloat(weight.toFixed(0)),
      });

      variantIndex++;
    });
  });

  // Create variants object for filtering
  const variantsObject = {
    sizes: sizes.map(String),
    colors: [...new Set(colors)],
    extra: {
      materials: materials.length > 0 ? [...new Set(materials)] : [],
      fits: fits.length > 0 ? [...new Set(fits)] : [],
    },
  };

  return {
    inventory,
    variants: variantsObject, // Object for filtering
    variantsArray: variantArray, // Array for backward compatibility
  };
};

// Helper to create complete product with inventory and variants
const createProduct = (productData, productType, baseSku, sizes, colors, basePrice, discountPercent, totalStock, materials = [], fits = []) => {
  const result = generateInventoryAndVariants(productType, baseSku, sizes, colors, basePrice, discountPercent, totalStock, materials, fits);
  return {
    ...productData,
    inventory: result.inventory,
    variants: result.variants,
    variantsArray: result.variantsArray, // Backward compatibility
  };
};

// Mock data for products - MongoDB Schema Format (Improved for GZMart)
export const products = [
    createProduct(
      {
        _id: "507f1f77bcf86cd799439011",
        seller_id: "507f191e810c19729de860ea",
        name: "Adidas Ultra Boost",
        summary: "Long distance running requires a lot from athletes.",
        description: "Premium running shoes with responsive Boost cushioning. Long distance running requires a lot from athletes.",
        brand: "Adidas",
        category: "507f1f77bcf86cd799439012",
        productType: "shoes",
        sku: "AD-UB-001",
        tags: ["Adidas", "Shoes", "Sneakers", "Ultraboost", "Running", "Athletic"],
        price: {
          regular: 110.4,
          discountPercent: 10,
          isOnSale: true,
        },
        finalPrice: 99.36,
        mainImage: "https://sneakernews.com/wp-content/uploads/2020/12/adidas-Ultra-Boost-1.0-DNA-H68156-8.jpg?w=1140",
        images: [
          "https://sneakernews.com/wp-content/uploads/2020/12/adidas-Ultra-Boost-1.0-DNA-H68156-8.jpg?w=1140",
          "https://th.bing.com/th/id/OIP.6pVPhRqi-OTi9Ru3yHSJYgHaFM?pid=ImgDet&w=474&h=332&rs=1",
          "https://th.bing.com/th/id/OIP.3UuYSuGwiNR2ms7XT4TeHAHaHa?pid=ImgDet&w=474&h=474&rs=1",
        ],
        status: true,
        stock: 21,
        sales: 1269,
        rating: 4.5,
        isNew: true,
        attributes: {
          gender: "unisex",
          material: "Primeknit, Boost",
          season: "All Season",
          style: "Running",
          care: "Machine washable",
        },
      },
      "shoes",
      "AD-UB-001",
      ["US 7", "US 8", "US 9", "US 10", "US 11"],
      ["Black", "White", "Blue"],
      110.4,
      10,
      21,
      ["Primeknit", "Mesh"],
      ["Regular"]
    ),
    createProduct(
      {
        _id: "507f1f77bcf86cd799439012",
        seller_id: "507f191e810c19729de860eb",
        name: "Nike Air Max 270",
        summary: "The Nike Air Max 270 delivers visible cushioning under every step",
        description: "The Nike Air Max 270 features a large window and visible air unit for maximum cushioning. Delivers visible cushioning under every step.",
        brand: "Nike",
        category: "507f1f77bcf86cd799439012",
        productType: "shoes",
        sku: "NK-AM270-001",
        tags: ["Nike", "Air Max", "Lifestyle", "Casual", "Comfort"],
        price: {
          regular: 150.0,
          discountPercent: 0,
          isOnSale: false,
        },
        finalPrice: 150.0,
        mainImage: "https://static.nike.com/a/images/t_PDP_1280_v1/f_auto,q_auto:eco/gorfwjchoasrrzr1fggt/air-max-270-shoes-nnTrqDGR.png",
        images: [
          "https://static.nike.com/a/images/t_PDP_1280_v1/f_auto,q_auto:eco/gorfwjchoasrrzr1fggt/air-max-270-shoes-nnTrqDGR.png",
          "https://th.bing.com/th/id/OIP.6pVPhRqi-OTi9Ru3yHSJYgHaFM?pid=ImgDet&w=474&h=332&rs=1",
          "https://th.bing.com/th/id/OIP.3UuYSuGwiNR2ms7XT4TeHAHaHa?pid=ImgDet&w=474&h=474&rs=1",
        ],
        status: true,
        stock: 30,
        sales: 2150,
        rating: 4.3,
        isNew: false,
        attributes: {
          gender: "unisex",
          material: "Synthetic, Air Max",
          season: "All Season",
          style: "Lifestyle",
          care: "Wipe clean",
        },
      },
      "shoes",
      "NK-AM270-001",
      ["US 7", "US 8", "US 9", "US 10"],
      ["Red", "Black", "White"],
      150.0,
      0,
      30,
      ["Synthetic", "Mesh"],
      ["Regular"]
    ),
    createProduct(
      {
        _id: "507f1f77bcf86cd799439013",
        seller_id: "507f191e810c19729de860ec",
        name: "Puma RS-X",
        summary: "Retro-inspired design with modern technology",
        description: "The Puma RS-X combines retro style with modern comfort. Retro-inspired design with modern technology.",
        brand: "Puma",
        category: "507f1f77bcf86cd799439012",
        productType: "shoes",
        sku: "PM-RSX-001",
        tags: ["Puma", "RS-X", "Lifestyle", "Retro", "Streetwear"],
        price: {
          regular: 137.5,
          discountPercent: 20,
          isOnSale: true,
        },
        finalPrice: 110.0,
        mainImage: "https://woker.vtexassets.com/arquivos/ids/411653-800-800?v=638351355999630000&width=800&height=800&aspect=true",
        images: [
          "https://woker.vtexassets.com/arquivos/ids/411653-800-800?v=638351355999630000&width=800&height=800&aspect=true",
          "https://th.bing.com/th/id/OIP.6pVPhRqi-OTi9Ru3yHSJYgHaFM?pid=ImgDet&w=474&h=332&rs=1",
          "https://th.bing.com/th/id/OIP.3UuYSuGwiNR2ms7XT4TeHAHaHa?pid=ImgDet&w=474&h=474&rs=1",
        ],
        status: true,
        stock: 15,
        sales: 1200,
        rating: 4.2,
        isNew: false,
        attributes: {
          gender: "unisex",
          material: "Synthetic, Leather",
          season: "All Season",
          style: "Retro",
          care: "Wipe clean",
        },
      },
      "shoes",
      "PM-RSX-001",
      ["US 8", "US 9", "US 10", "US 11"],
      ["Blue", "White", "Red"],
      137.5,
      20,
      15,
      ["Synthetic", "Leather"],
      ["Regular"]
    ),
    createProduct(
      {
        _id: "507f1f77bcf86cd799439014",
        seller_id: "507f191e810c19729de860ed",
        name: "New Balance 574",
        summary: "Classic New Balance design with modern comfort",
        description: "The New Balance 574 combines timeless style with contemporary comfort. Classic New Balance design with modern comfort.",
        brand: "New Balance",
        category: "507f1f77bcf86cd799439012",
        productType: "shoes",
        sku: "NB-574-001",
        tags: ["New Balance", "574", "Lifestyle", "Classic", "Comfort"],
        price: {
          regular: 105.99,
          discountPercent: 15,
          isOnSale: true,
        },
        finalPrice: 90.09,
        mainImage: "https://th.bing.com/th/id/OIP.5wdGyg6Ucq07qSwk7yeN8wHaHa?rs=1&pid=ImgDetMain",
        images: [
          "https://th.bing.com/th/id/OIP.5wdGyg6Ucq07qSwk7yeN8wHaHa?rs=1&pid=ImgDetMain",
          "https://th.bing.com/th/id/OIP.6pVPhRqi-OTi9Ru3yHSJYgHaFM?pid=ImgDet&w=474&h=332&rs=1",
          "https://th.bing.com/th/id/OIP.3UuYSuGwiNR2ms7XT4TeHAHaHa?pid=ImgDet&w=474&h=474&rs=1",
        ],
        status: true,
        stock: 20,
        sales: 1500,
        rating: 4.4,
        isNew: true,
        attributes: {
          gender: "unisex",
          material: "Suede, Mesh",
          season: "All Season",
          style: "Classic",
          care: "Spot clean",
        },
      },
      "shoes",
      "NB-574-001",
      ["US 7", "US 8", "US 9", "US 10", "US 11"],
      ["Grey", "Navy", "Red"],
      105.99,
      15,
      20,
      ["Suede", "Mesh"],
      ["Regular"]
    ),
    createProduct(
      {
        _id: "507f1f77bcf86cd799439015",
        seller_id: "507f191e810c19729de860ee",
        name: "Reebok Classic Leather",
        summary: "Timeless leather sneaker with classic design",
        description: "The Reebok Classic Leather features premium leather construction. Timeless leather sneaker with classic design.",
        brand: "Reebok",
        category: "507f1f77bcf86cd799439012",
        productType: "shoes",
        sku: "RB-CL-001",
        tags: ["Reebok", "Classic", "Lifestyle", "Leather", "Vintage"],
        price: {
          regular: 75.0,
          discountPercent: 0,
          isOnSale: false,
        },
        finalPrice: 75.0,
        mainImage: "https://th.bing.com/th/id/OIP.-yP72Ukowrdlq4B4HDzAhgHaHa?rs=1&pid=ImgDetMain",
        images: [
          "https://th.bing.com/th/id/OIP.-yP72Ukowrdlq4B4HDzAhgHaHa?rs=1&pid=ImgDetMain",
          "https://th.bing.com/th/id/OIP.6pVPhRqi-OTi9Ru3yHSJYgHaFM?pid=ImgDet&w=474&h=332&rs=1",
          "https://th.bing.com/th/id/OIP.3UuYSuGwiNR2ms7XT4TeHAHaHa?pid=ImgDet&w=474&h=474&rs=1",
        ],
        status: true,
        stock: 25,
        sales: 2000,
        rating: 4.1,
        isNew: false,
        attributes: {
          gender: "unisex",
          material: "Leather",
          season: "All Season",
          style: "Classic",
          care: "Wipe clean",
        },
      },
      "shoes",
      "RB-CL-001",
      ["US 7", "US 8", "US 9", "US 10"],
      ["White", "Black", "Navy"],
      75.0,
      0,
      25,
      ["Leather"],
      ["Regular"]
    ),
    createProduct(
      {
        _id: "507f1f77bcf86cd799439016",
        seller_id: "507f191e810c19729de860ef",
        name: "Converse Chuck Taylor",
        summary: "The iconic canvas sneaker that never goes out of style",
        description: "The Converse Chuck Taylor All Star is a timeless classic. The iconic canvas sneaker that never goes out of style.",
        brand: "Converse",
        category: "507f1f77bcf86cd799439012",
        productType: "shoes",
        sku: "CV-CT-001",
        tags: ["Converse", "Chuck Taylor", "Lifestyle", "Iconic", "Canvas"],
        price: {
          regular: 55.0,
          discountPercent: 0,
          isOnSale: false,
        },
        finalPrice: 55.0,
        mainImage: "https://cdn.shopify.com/s/files/1/0324/6781/2487/products/shopify-full-image-2000x2000_64b62176-dbb2-423e-8938-443da9aa7c1d_1024x.png?v=1590288081",
        images: [
          "https://cdn.shopify.com/s/files/1/0324/6781/2487/products/shopify-full-image-2000x2000_64b62176-dbb2-423e-8938-443da9aa7c1d_1024x.png?v=1590288081",
          "https://sneakernews.com/wp-content/uploads/2020/12/adidas-Ultra-Boost-1.0-DNA-H68156-8.jpg?w=1140",
          "https://th.bing.com/th/id/OIP.3UuYSuGwiNR2ms7XT4TeHAHaHa?pid=ImgDet&w=474&h=474&rs=1",
        ],
        status: true,
        stock: 50,
        sales: 5000,
        rating: 4.6,
        isNew: true,
        attributes: {
          gender: "unisex",
          material: "Canvas",
          season: "All Season",
          style: "Classic",
          care: "Machine washable",
        },
      },
      "shoes",
      "CV-CT-001",
      ["US 7", "US 8", "US 9", "US 10", "US 11"],
      ["Black", "White", "Red"],
      55.0,
      0,
      50,
      ["Canvas"],
      ["Regular"]
    ),
    createProduct(
      {
        _id: "507f1f77bcf86cd799439017",
        seller_id: "507f191e810c19729de860f0",
        name: "Vans Old Skool",
        summary: "Classic skate shoe with the iconic side stripe",
        description: "The Vans Old Skool features the iconic side stripe and durable canvas. Classic skate shoe with the iconic side stripe.",
        brand: "Vans",
        category: "507f1f77bcf86cd799439012",
        productType: "shoes",
        sku: "VN-OS-001",
        tags: ["Vans", "Old Skool", "Skateboarding", "Streetwear", "Canvas"],
        price: {
          regular: 65.0,
          discountPercent: 0,
          isOnSale: false,
        },
        finalPrice: 65.0,
        mainImage: "https://th.bing.com/th/id/R.b9b56fb6a4c44722886b49eff30b1f97?rik=MxhhVsDYUpwZSw&pid=ImgRaw&r=0",
        images: [
          "https://th.bing.com/th/id/R.b9b56fb6a4c44722886b49eff30b1f97?rik=MxhhVsDYUpwZSw&pid=ImgRaw&r=0",
          "https://th.bing.com/th/id/OIP.6pVPhRqi-OTi9Ru3yHSJYgHaFM?pid=ImgDet&w=474&h=332&rs=1",
          "https://th.bing.com/th/id/OIP.3UuYSuGwiNR2ms7XT4TeHAHaHa?pid=ImgDet&w=474&h=474&rs=1",
        ],
        status: true,
        stock: 30,
        sales: 3500,
        rating: 4.3,
        isNew: false,
        attributes: {
          gender: "unisex",
          material: "Canvas, Suede",
          season: "All Season",
          style: "Skate",
          care: "Spot clean",
        },
      },
      "shoes",
      "VN-OS-001",
      ["US 7", "US 8", "US 9", "US 10"],
      ["Black", "White", "Navy"],
      65.0,
      0,
      30,
      ["Canvas", "Suede"],
      ["Regular"]
    ),
    createProduct(
      {
        _id: "507f1f77bcf86cd799439018",
        seller_id: "507f191e810c19729de860f1",
        name: "Adidas Samba",
        summary: "Iconic indoor soccer shoe with timeless style",
        description: "The Adidas Samba is a classic indoor soccer shoe. Iconic indoor soccer shoe with timeless style.",
        brand: "Adidas",
        category: "507f1f77bcf86cd799439012",
        productType: "shoes",
        sku: "AD-SB-001",
        tags: ["Adidas", "Samba", "Soccer", "Indoor", "Classic"],
        price: {
          regular: 99.99,
          discountPercent: 0,
          isOnSale: false,
        },
        finalPrice: 99.99,
        mainImage: "https://th.bing.com/th/id/OIP.81YGmCDrRsgih3_rHL6qxgHaHa?rs=1&pid=ImgDetMain",
        images: [
          "https://th.bing.com/th/id/OIP.81YGmCDrRsgih3_rHL6qxgHaHa?rs=1&pid=ImgDetMain",
          "https://th.bing.com/th/id/OIP.6pVPhRqi-OTi9Ru3yHSJYgHaFM?pid=ImgDet&w=474&h=332&rs=1",
          "https://th.bing.com/th/id/OIP.3UuYSuGwiNR2ms7XT4TeHAHaHa?pid=ImgDet&w=474&h=474&rs=1",
        ],
        status: true,
        stock: 15,
        sales: 2800,
        rating: 4.4,
        isNew: false,
        attributes: {
          gender: "unisex",
          material: "Leather, Gum Sole",
          season: "All Season",
          style: "Soccer",
          care: "Wipe clean",
        },
      },
      "shoes",
      "AD-SB-001",
      ["US 7", "US 8", "US 9", "US 10"],
      ["White", "Black", "Green"],
      99.99,
      0,
      15,
      ["Leather"],
      ["Regular"]
    ),
    createProduct(
      {
        _id: "507f1f77bcf86cd799439019",
        seller_id: "507f191e810c19729de860f2",
        name: "Nike Air Jordan 1",
        summary: "The Air Jordan 1 revolutionized basketball footwear",
        description: "The Air Jordan 1 is the shoe that started it all. The Air Jordan 1 revolutionized basketball footwear.",
        brand: "Nike",
        category: "507f1f77bcf86cd799439012",
        productType: "shoes",
        sku: "NK-AJ1-001",
        tags: ["Nike", "Air Jordan", "Basketball", "Iconic", "Collectible"],
        price: {
          regular: 170.0,
          discountPercent: 0,
          isOnSale: false,
        },
        finalPrice: 170.0,
        mainImage: "https://th.bing.com/th/id/OIP.rg3jj-AOPenukfG6CV2JwAHaHa?rs=1&pid=ImgDetMain",
        images: [
          "https://th.bing.com/th/id/OIP.rg3jj-AOPenukfG6CV2JwAHaHa?rs=1&pid=ImgDetMain",
          "https://th.bing.com/th/id/OIP.6pVPhRqi-OTi9Ru3yHSJYgHaFM?pid=ImgDet&w=474&h=332&rs=1",
          "https://th.bing.com/th/id/OIP.3UuYSuGwiNR2ms7XT4TeHAHaHa?pid=ImgDet&w=474&h=474&rs=1",
        ],
        status: true,
        stock: 25,
        sales: 3600,
        rating: 4.8,
        isNew: false,
        attributes: {
          gender: "unisex",
          material: "Leather, Synthetic",
          season: "All Season",
          style: "Basketball",
          care: "Wipe clean",
        },
      },
      "shoes",
      "NK-AJ1-001",
      ["US 7", "US 8", "US 9", "US 10", "US 11"],
      ["Red", "Black", "White"],
      170.0,
      0,
      25,
      ["Leather", "Synthetic"],
      ["Regular"]
    ),
    createProduct(
      {
        _id: "507f1f77bcf86cd79943901a",
        seller_id: "507f191e810c19729de860f3",
        name: "Adidas Yeezy Boost 350",
        summary: "Revolutionary design meets comfort",
        description: "The Yeezy Boost 350 features a Primeknit upper. Revolutionary design meets comfort.",
        brand: "Adidas",
        category: "507f1f77bcf86cd799439012",
        productType: "shoes",
        sku: "AD-YZ350-001",
        tags: ["Adidas", "Yeezy", "Lifestyle", "Premium", "Limited"],
        price: {
          regular: 230.0,
          discountPercent: 0,
          isOnSale: false,
        },
        finalPrice: 230.0,
        mainImage: "https://sneakernews.com/wp-content/uploads/2019/04/adidas-yeezy-boost-350-v2-black-fu9013-release-date-6.jpg",
        images: [
          "https://sneakernews.com/wp-content/uploads/2019/04/adidas-yeezy-boost-350-v2-black-fu9013-release-date-6.jpg",
          "https://th.bing.com/th/id/OIP.6pVPhRqi-OTi9Ru3yHSJYgHaFM?pid=ImgDet&w=474&h=332&rs=1",
          "https://th.bing.com/th/id/OIP.3UuYSuGwiNR2ms7XT4TeHAHaHa?pid=ImgDet&w=474&h=474&rs=1",
        ],
        status: true,
        stock: 5,
        sales: 1200,
        rating: 4.7,
        isNew: false,
        attributes: {
          gender: "unisex",
          material: "Primeknit, Boost",
          season: "All Season",
          style: "Lifestyle",
          care: "Spot clean",
        },
      },
      "shoes",
      "AD-YZ350-001",
      ["US 7", "US 8", "US 9", "US 10"],
      ["Black", "White", "Grey"],
      230.0,
      0,
      5,
      ["Primeknit"],
      ["Regular"]
    ),
    createProduct(
      {
        _id: "507f1f77bcf86cd79943901b",
        seller_id: "507f191e810c19729de860f4",
        name: "Nike Air Force 1",
        summary: "The classic white sneaker",
        description: "The Nike Air Force 1 is a timeless classic. The classic white sneaker.",
        brand: "Nike",
        category: "507f1f77bcf86cd799439012",
        productType: "shoes",
        sku: "NK-AF1-001",
        tags: ["Nike", "Air Force", "Lifestyle", "Classic", "White"],
        price: {
          regular: 100.0,
          discountPercent: 0,
          isOnSale: false,
        },
        finalPrice: 100.0,
        mainImage: "https://th.bing.com/th/id/R.04955c245a52516cf9a17190aee595e8?rik=XU21QMl3VZldlw&riu=http%3a%2f%2fimages.nike.com%2fis%2fimage%2fDotCom%2fCW2288_111_A_PREM%3fhei%3d3144%26wid%3d3144%26fmt%3djpg%26bgc%3dF5F5F5%26iccEmbed%3d1&ehk=frYGYsDc2TeDApdId9KFvTcUeryITlEAq%2bNPRgrpd7Q%3d&risl=&pid=ImgRaw&r=0",
        images: [
          "https://th.bing.com/th/id/R.04955c245a52516cf9a17190aee595e8?rik=XU21QMl3VZldlw&riu=http%3a%2f%2fimages.nike.com%2fis%2fimage%2fDotCom%2fCW2288_111_A_PREM%3fhei%3d3144%26wid%3d3144%26fmt%3djpg%26bgc%3dF5F5F5%26iccEmbed%3d1&ehk=frYGYsDc2TeDApdId9KFvTcUeryITlEAq%2bNPRgrpd7Q%3d&risl=&pid=ImgRaw&r=0",
          "https://th.bing.com/th/id/OIP.6pVPhRqi-OTi9Ru3yHSJYgHaFM?pid=ImgDet&w=474&h=332&rs=1",
          "https://th.bing.com/th/id/OIP.3UuYSuGwiNR2ms7XT4TeHAHaHa?pid=ImgDet&w=474&h=474&rs=1",
        ],
        status: true,
        stock: 30,
        sales: 4500,
        rating: 4.5,
        isNew: false,
        attributes: {
          gender: "unisex",
          material: "Leather",
          season: "All Season",
          style: "Classic",
          care: "Wipe clean",
        },
      },
      "shoes",
      "NK-AF1-001",
      ["US 7", "US 8", "US 9", "US 10", "US 11"],
      ["White", "Black", "Red"],
      100.0,
      0,
      30,
      ["Leather"],
      ["Regular"]
    ),
  ];
  
  // Mock data for orders
  export const orders = [
    {
      id: 1,
      customer: "John Doe",
      date: "2024-03-20",
      amount: 110.4,
      status: "Completed",
      items: [
        {
          productId: 1,
          name: "Adidas Ultra boost",
          quantity: 1,
          price: 110.4,
        },
      ],
    },
    {
      id: 2,
      customer: "Jane Smith",
      date: "2024-03-19",
      amount: 250.0,
      status: "Processing",
      items: [
        {
          productId: 4,
          name: "Nike ZoomX Vaporfly",
          quantity: 1,
          price: 250.0,
        },
      ],
    },
    {
      id: 3,
      customer: "Mike Johnson",
      date: "2024-03-18",
      amount: 179.98,
      status: "Completed",
      items: [
        {
          productId: 5,
          name: "Adidas Forum Low",
          quantity: 2,
          price: 89.99,
        },
      ],
    },
    {
      id: 4,
      customer: "Sarah Wilson",
      date: "2024-03-17",
      amount: 345.0,
      status: "Completed",
      items: [
        {
          productId: 10,
          name: "Nike Air Jordan 1",
          quantity: 1,
          price: 170.0,
        },
        {
          productId: 15,
          name: "Adidas Stan Smith",
          quantity: 1,
          price: 85.0,
        },
        {
          productId: 20,
          name: "Nike Zoom Fly 5",
          quantity: 1,
          price: 90.0,
        },
      ],
    },
    {
      id: 5,
      customer: "David Brown",
      date: "2024-03-16",
      amount: 130.0,
      status: "Processing",
      items: [
        {
          productId: 14,
          name: "Nike Air Max 90",
          quantity: 1,
          price: 130.0,
        },
      ],
    },
    {
      id: 6,
      customer: "Emily Davis",
      date: "2024-03-15",
      amount: 460.0,
      status: "Completed",
      items: [
        {
          productId: 18,
          name: "Nike Air Jordan 4",
          quantity: 1,
          price: 200.0,
        },
        {
          productId: 17,
          name: "Adidas Yeezy Boost 350",
          quantity: 1,
          price: 230.0,
        },
      ],
    },
    {
      id: 7,
      customer: "Robert Taylor",
      date: "2024-03-14",
      amount: 85.0,
      status: "Completed",
      items: [
        {
          productId: 9,
          name: "Adidas Gazelle",
          quantity: 1,
          price: 85.0,
        },
      ],
    },
    {
      id: 8,
      customer: "Lisa Anderson",
      date: "2024-03-13",
      amount: 200.0,
      status: "Processing",
      items: [
        {
          productId: 8,
          name: "Nike Air Force 1",
          quantity: 2,
          price: 100.0,
        },
      ],
    },
    {
      id: 9,
      customer: "James Wilson",
      date: "2024-03-12",
      amount: 180.0,
      status: "Completed",
      items: [
        {
          productId: 19,
          name: "Adidas Ultraboost 22",
          quantity: 1,
          price: 180.0,
        },
      ],
    },
    {
      id: 10,
      customer: "Maria Garcia",
      date: "2024-03-11",
      amount: 260.0,
      status: "Completed",
      items: [
        {
          productId: 3,
          name: "Nike Air Max 270",
          quantity: 1,
          price: 150.0,
        },
        {
          productId: 7,
          name: "Adidas Samba",
          quantity: 1,
          price: 99.99,
        },
      ],
    },
    {
      id: 11,
      customer: "Thomas Lee",
      date: "2024-03-10",
      amount: 115.0,
      status: "Processing",
      items: [
        {
          productId: 6,
          name: "Nike Dunk Low",
          quantity: 1,
          price: 115.0,
        },
      ],
    },
    {
      id: 12,
      customer: "Jennifer White",
      date: "2024-03-09",
      amount: 175.0,
      status: "Completed",
      items: [
        {
          productId: 16,
          name: "Nike Air Max 97",
          quantity: 1,
          price: 175.0,
        },
      ],
    },
    {
      id: 13,
      customer: "William Clark",
      date: "2024-03-08",
      amount: 130.0,
      status: "Processing",
      items: [
        {
          productId: 13,
          name: "Adidas NMD R1",
          quantity: 1,
          price: 130.0,
        },
      ],
    },
    {
      id: 14,
      customer: "Patricia Martinez",
      date: "2024-03-07",
      amount: 180.0,
      status: "Completed",
      items: [
        {
          productId: 11,
          name: "Adidas Superstar",
          quantity: 2,
          price: 90.0,
        },
      ],
    },
    {
      id: 15,
      customer: "Michael Thompson",
      date: "2024-03-06",
      amount: 95.0,
      status: "Completed",
      items: [
        {
          productId: 12,
          name: "Nike Blazer Mid",
          quantity: 1,
          price: 95.0,
        },
      ],
    },
    {
      id: 16,
      customer: "Elizabeth Hall",
      date: "2024-03-05",
      amount: 340.0,
      status: "Processing",
      items: [
        {
          productId: 2,
          name: "ADIZERO SL RUNNING",
          quantity: 2,
          price: 64.4,
        },
        {
          productId: 20,
          name: "Nike Zoom Fly 5",
          quantity: 1,
          price: 160.0,
        },
      ],
    },
    {
      id: 17,
      customer: "Daniel Allen",
      date: "2024-03-04",
      amount: 200.0,
      status: "Completed",
      items: [
        {
          productId: 18,
          name: "Nike Air Jordan 4",
          quantity: 1,
          price: 200.0,
        },
      ],
    },
    {
      id: 18,
      customer: "Susan Young",
      date: "2024-03-03",
      amount: 85.0,
      status: "Processing",
      items: [
        {
          productId: 15,
          name: "Adidas Stan Smith",
          quantity: 1,
          price: 85.0,
        },
      ],
    },
    {
      id: 19,
      customer: "Joseph King",
      date: "2024-03-02",
      amount: 230.0,
      status: "Completed",
      items: [
        {
          productId: 17,
          name: "Adidas Yeezy Boost 350",
          quantity: 1,
          price: 230.0,
        },
      ],
    },
    {
      id: 20,
      customer: "Margaret Wright",
      date: "2024-03-01",
      amount: 160.0,
      status: "Processing",
      items: [
        {
          productId: 20,
          name: "Nike Zoom Fly 5",
          quantity: 1,
          price: 160.0,
        },
      ],
    },
    {
      id: 21,
      customer: "Christopher Lee",
      date: "2024-02-29",
      amount: 89.99,
      status: "Completed",
      items: [
        {
          productId: 21,
          name: "New Balance 574",
          quantity: 1,
          price: 89.99,
        },
      ],
    },
    {
      id: 22,
      customer: "Jessica Taylor",
      date: "2024-02-28",
      amount: 110.0,
      status: "Processing",
      items: [
        {
          productId: 22,
          name: "Puma RS-X",
          quantity: 1,
          price: 110.0,
        },
      ],
    },
    {
      id: 23,
      customer: "Andrew Wilson",
      date: "2024-02-27",
      amount: 150.0,
      status: "Completed",
      items: [
        {
          productId: 23,
          name: "Reebok Classic Leather",
          quantity: 2,
          price: 75.0,
        },
      ],
    },
    {
      id: 24,
      customer: "Sophia Brown",
      date: "2024-02-26",
      amount: 165.0,
      status: "Processing",
      items: [
        {
          productId: 24,
          name: "Converse Chuck Taylor All Star",
          quantity: 3,
          price: 55.0,
        },
      ],
    },
    {
      id: 25,
      customer: "Matthew Davis",
      date: "2024-02-25",
      amount: 130.0,
      status: "Completed",
      items: [
        {
          productId: 25,
          name: "Vans Old Skool",
          quantity: 2,
          price: 65.0,
        },
      ],
    },
  ];
  
  export const discounts = [
    {
      id: 1,
      code: "SUMMER2024",
      percentage: 20,
      totalDiscount: 100,
      totalUsed: 45,
      minimumAmount: 50.0,
      maximumDiscount: 100.0,
      status: "Active",
    },
    {
      id: 2,
      code: "WELCOME10",
      percentage: 10,
      totalDiscount: 100,
      totalUsed: 32,
      minimumAmount: 30.0,
      maximumDiscount: 50.0,
      status: "Active",
    },
    {
      id: 3,
      code: "SPRING15",
      percentage: 15,
      totalDiscount: 100,
      totalUsed: 28,
      minimumAmount: 75.0,
      maximumDiscount: 75.0,
      status: "Active",
    },
    {
      id: 4,
      code: "FLASH25",
      percentage: 25,
      totalDiscount: 100,
      totalUsed: 15,
      minimumAmount: 100.0,
      maximumDiscount: 150.0,
      status: "Active",
    },
    {
      id: 5,
      code: "LOYALTY20",
      percentage: 20,
      totalDiscount: 100,
      totalUsed: 40,
      minimumAmount: 60.0,
      maximumDiscount: 80.0,
      status: "Active",
    },
    {
      id: 6,
      code: "HOLIDAY30",
      percentage: 30,
      totalDiscount: 100,
      totalUsed: 20,
      minimumAmount: 150.0,
      maximumDiscount: 200.0,
      status: "Active",
    },
    {
      id: 7,
      code: "NEWUSER15",
      percentage: 15,
      totalDiscount: 100,
      totalUsed: 25,
      minimumAmount: 40.0,
      maximumDiscount: 60.0,
      status: "Active",
    },
    {
      id: 8,
      code: "BULK25",
      percentage: 25,
      totalDiscount: 100,
      totalUsed: 18,
      minimumAmount: 200.0,
      maximumDiscount: 250.0,
      status: "Active",
    },
    {
      id: 9,
      code: "CLEARANCE40",
      percentage: 40,
      totalDiscount: 100,
      totalUsed: 12,
      minimumAmount: 80.0,
      maximumDiscount: 120.0,
      status: "Active",
    },
    {
      id: 10,
      code: "WEEKEND20",
      percentage: 20,
      totalDiscount: 100,
      totalUsed: 35,
      minimumAmount: 50.0,
      maximumDiscount: 70.0,
      status: "Active",
    },
    {
      id: 11,
      code: "SPORTS15",
      percentage: 15,
      totalDiscount: 100,
      totalUsed: 22,
      minimumAmount: 70.0,
      maximumDiscount: 90.0,
      status: "Active",
    },
    {
      id: 12,
      code: "FAMILY25",
      percentage: 25,
      totalDiscount: 100,
      totalUsed: 15,
      minimumAmount: 150.0,
      maximumDiscount: 180.0,
      status: "Active",
    },
    {
      id: 13,
      code: "STUDENT10",
      percentage: 10,
      totalDiscount: 100,
      totalUsed: 45,
      minimumAmount: 30.0,
      maximumDiscount: 40.0,
      status: "Active",
    },
    {
      id: 14,
      code: "MILITARY20",
      percentage: 20,
      totalDiscount: 100,
      totalUsed: 18,
      minimumAmount: 50.0,
      maximumDiscount: 60.0,
      status: "Active",
    },
    {
      id: 15,
      code: "BIRTHDAY15",
      percentage: 15,
      totalDiscount: 100,
      totalUsed: 30,
      minimumAmount: 40.0,
      maximumDiscount: 50.0,
      status: "Active",
    },
  ];
  
  export const users = [
    {
      id: 1,
      name: "John Doe",
      email: "john@example.com",
      phone: "123-456-7890",
      role: "Admin",
      status: "Active",
    },
    {
      id: 2,
      name: "Jane Smith",
      email: "jane@example.com",
      phone: "098-765-4321",
      role: "User",
      status: "Active",
    },
    {
      id: 3,
      name: "Mike Johnson",
      email: "mike@example.com",
      phone: "555-123-4567",
      role: "User",
      status: "Active",
    },
    {
      id: 4,
      name: "Sarah Wilson",
      email: "sarah@example.com",
      phone: "555-987-6543",
      role: "Admin",
      status: "Inactive",
    },
    {
      id: 5,
      name: "David Brown",
      email: "david@example.com",
      phone: "555-456-7890",
      role: "User",
      status: "Active",
    },
    {
      id: 6,
      name: "Emily Davis",
      email: "emily@example.com",
      phone: "555-789-0123",
      role: "User",
      status: "Active",
    },
    {
      id: 7,
      name: "Robert Taylor",
      email: "robert@example.com",
      phone: "555-234-5678",
      role: "User",
      status: "Inactive",
    },
    {
      id: 8,
      name: "Lisa Anderson",
      email: "lisa@example.com",
      phone: "555-345-6789",
      role: "User",
      status: "Active",
    },
    {
      id: 9,
      name: "James Wilson",
      email: "james@example.com",
      phone: "555-456-7890",
      role: "Admin",
      status: "Active",
    },
    {
      id: 10,
      name: "Maria Garcia",
      email: "maria@example.com",
      phone: "555-567-8901",
      role: "User",
      status: "Active",
    },
    {
      id: 11,
      name: "Thomas Lee",
      email: "thomas@example.com",
      phone: "555-678-9012",
      role: "User",
      status: "Inactive",
    },
    {
      id: 12,
      name: "Jennifer White",
      email: "jennifer@example.com",
      phone: "555-789-0123",
      role: "User",
      status: "Active",
    },
    {
      id: 13,
      name: "William Clark",
      email: "william@example.com",
      phone: "555-890-1234",
      role: "User",
      status: "Active",
    },
    {
      id: 14,
      name: "Patricia Martinez",
      email: "patricia@example.com",
      phone: "555-901-2345",
      role: "User",
      status: "Active",
    },
    {
      id: 15,
      name: "Michael Thompson",
      email: "michael@example.com",
      phone: "555-012-3456",
      role: "User",
      status: "Inactive",
    },
    {
      id: 16,
      name: "Elizabeth Hall",
      email: "elizabeth@example.com",
      phone: "555-123-4567",
      role: "User",
      status: "Active",
    },
    {
      id: 17,
      name: "Daniel Allen",
      email: "daniel@example.com",
      phone: "555-234-5678",
      role: "User",
      status: "Active",
    },
    {
      id: 18,
      name: "Susan Young",
      email: "susan@example.com",
      phone: "555-345-6789",
      role: "User",
      status: "Inactive",
    },
    {
      id: 19,
      name: "Joseph King",
      email: "joseph@example.com",
      phone: "555-456-7890",
      role: "User",
      status: "Active",
    },
    {
      id: 20,
      name: "Margaret Wright",
      email: "margaret@example.com",
      phone: "555-567-8901",
      role: "User",
      status: "Active",
    },
  ];
  
  // Helper functions
  export const getAllProducts = () => products;
  
  export const getProducts = (page = 1, pageSize = 9) => {
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return products.slice(startIndex, endIndex);
  };
  
  export const getProductById = (id) =>
    // Support both old format (id) and new format (_id)
    products.find((product) => product._id === id || product.id === id);
  
  export const getOrders = (page = 1, pageSize = 10) => {
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return orders.slice(startIndex, endIndex);
  };
  
  export const getOrderById = (id) => orders.find((order) => order.id === id);
  
  export const getTotalProducts = () => products.length;
  
  export const getTotalOrders = () => orders.length;
  
  export const getDiscounts = (page = 1, pageSize = 10) => {
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return discounts.slice(startIndex, endIndex);
  };
  
  export const getDiscountById = (id) => discounts.find((discount) => discount.id === id);
  
  export const getTotalDiscounts = () => discounts.length;
  
  export const getUsers = (page = 1, pageSize = 9) => {
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return users.slice(startIndex, endIndex);
  };
  
  export const getUserById = (id) => users.find((user) => user.id === id);
  
  export const getTotalUsers = () => users.length;