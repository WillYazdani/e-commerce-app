const router = require('express').Router();
const { Tag, Product, ProductTag } = require('../../models');

// The `/api/tags` endpoint

router.get('/', (req, res) => {
  // find all tags
  // be sure to include its associated Product data
  Tag.findAll({
    include: [{
      model: Product,
      attributes: ['product_name', 'id', 'price', 'stock'],
    }]
  })
    .then(dbTagData => res.json(dbTagData))
    .catch(err => {
      console.log(err);
      res.status(500).json(err);
    }
  );
});

router.get('/:id', (req, res) => {
  // find a single tag by its `id`
  // be sure to include its associated Product data
  Tag.findByPk(req.params.id, {
    include: [{
      model: Product,
      attributes: ['product_name', 'id', 'price', 'stock'],
    }]
  })
    .then(dbTagData => {
      if (!dbTagData) {
        res.status(404).json({ message: 'No tag found with this id' });
        return;
      }
      res.json(dbTagData);
    }
  )
});
  

router.post('/', (req, res) => {
  // create a new tag
  Tag.create(req.body)
    .then((tag) => {
      if (req.body.productIds.length) {
        const productTagIdArr = req.body.productIds.map((product_id) => {
          return {
            product_id,
            tag_id: tag.id,
          }
        });
        ProductTag.bulkCreate(productTagIdArr)
          .then(() => res.json(tag))
          .catch(err => {
            console.log(err);
            res.status(500).json(err);
          }
        );
      }
    });
});

router.put('/:id', (req, res) => {
  // update a tag's name by its `id` value
  Tag.update(req.body, {
    where: {
      id: req.params.id,
    },
  })
    .then((tag) => {
      return ProductTag.findAll({
        where: { tag_id: req.params.id },
      })
        .then((productTags) => {
          const productIds = productTags.map(productTag => productTag.product_id);
          return Product.findAll({
            where: {
              id: {
                [Op.notIn]: productIds,
              },
            },
          })
            .then((products) => {
              const productIds = products.map(product => product.id);
              const productTagIdArr = productIds.map((product_id) => {
                return {
                  product_id,
                  tag_id: req.params.id,
                }
              });
              ProductTag.bulkCreate(productTagIdArr)
                .then(() => res.json(tag))
                .catch(err => {
                  console.log(err);
                  res.status(500).json(err);
                }
              );
            });
        }
      );
    })
});

router.delete('/:id', (req, res) => {
  // delete on tag by its `id` value
  Tag.destroy({
    where: {
      id: req.params.id
    }
  })
    .then(dbTagData => {
      if (!dbTagData) {
        res.status(404).json({ message: 'No tag found with this id' });
        return;
      }
      res.json(dbTagData);
    }
  )
});

module.exports = router;
