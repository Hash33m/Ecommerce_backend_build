const router = require('express').Router();
const { Product, Category, Tag, ProductTag } = require('../../models');

router.get('/', async (req, res) => {
  try {
    const products = await Product.findAll({
      include: [
        {
          model: Category,
        },
        {
          model: Tag,
        },
      ],
    });
    res.json(products);
  } catch (error) {
    res.status(500).json(error);
  }
});

router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id, {
      include: [
        {
          model: Category,
        },
        {
          model: Tag,
        },
      ],
    });

    if (!product) {
      res.status(404).json({ message: 'Product not found' });
      return;
    }

    res.json(product);
  } catch (error) {
    res.status(500).json(error);
  }
});


router.post('/', async (req, res) => {
  try {
    const product = await Product.create(req.body);

    if (req.body.tagIds && req.body.tagIds.length) {
      const productTags = req.body.tagIds.map((tagId) => ({
        product_id: product.id,
        tag_id: tagId,
      }));

      await ProductTag.bulkCreate(productTags);
    }

    res.status(201).json(product);
  } catch (error) {
    res.status(500).json(error);
  }
});


router.put('/:id', async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);

    if (!product) {
      res.status(404).json({ message: 'Product not found' });
      return;
    }

    await product.update(req.body);

    if (req.body.tagIds && req.body.tagIds.length) {
      const existingProductTags = await ProductTag.findAll({
        where: { product_id: product.id },
      });

      const existingTagIds = existingProductTags.map((productTag) =>
        productTag.tag_id.toString()
      );

      const newTagIds = req.body.tagIds.filter(
        (tagId) => !existingTagIds.includes(tagId.toString())
      );

      const productTagsToRemove = existingProductTags.filter((productTag) =>
        !req.body.tagIds.includes(productTag.tag_id.toString())
      );

      await ProductTag.destroy({
        where: { id: productTagsToRemove.map((productTag) => productTag.id) },
      });

      const newProductTags = newTagIds.map((tagId) => ({
        product_id: product.id,
        tag_id: tagId,
      }));

      await ProductTag.bulkCreate(newProductTags);
    }

    res.json({ message: 'Product updated successfully' });
  } catch (error) {
    res.status(500).json(error);
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);

    if (!product) {
      res.status(404).json({ message: 'Product not found' });
      return;
    }

    await ProductTag.destroy({ where: { product_id: product.id } });
    await product.destroy();

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json(error);
  }
});

module.exports = router;

