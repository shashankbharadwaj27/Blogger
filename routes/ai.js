const {Router} = require('express');
const { restrictToLoggedinUserOnly } = require('../middlewares/authentication');
const {generateBlog, enhanceBlog} = require('../controllers/ai');

const router = new Router();

router.post('/generate',restrictToLoggedinUserOnly,generateBlog)
router.post('/enhance',restrictToLoggedinUserOnly,enhanceBlog)

module.exports = router;