const express = require("express")
const router = express.Router()
const User = require("./User")
const bcrypt = require('bcryptjs')
const adminAuth = require("../middleware/adminAuth")
const { check, validationResult } = require("express-validator")


router.get("/admin/users", adminAuth, (req, res) => {
  User.findAll().then(users => {
    res.render("admin/users/index", { users: users })
  })
})
router.get("/admin/users/create", (req, res) => {
  res.render("admin/users/create", { erros: {}, msg: req.flash('msg') })
})

router.post("/users/create", adminAuth, [
  //Validação
  check('email', "Favor inserir email valido").isEmail(),
  check('password', "Favor inserir senha maior de 5").isLength({ min: 5 }),
  check('name', "Favor preencher o campo").not().isEmpty()

], (req, res) => {

  const erros = validationResult(req)
  //Tratamento de erro
  if (!erros.isEmpty()) {
    res.render("admin/users/create", { erros: erros.mapped(), msg: '' })
  } else {
    var email = req.body.email
    var password = req.body.password
    var name = req.body.name
    //Verificar ser existe email igual
    User.findOne({ where: { email: email } }).then(user => {
      if (user != undefined) {
        req.flash('msg', 'Email já existe')
        res.redirect("/admin/users/create")
      } else {
        var salt = bcrypt.genSaltSync(10)
        var hash = bcrypt.hashSync(password, salt)

        User.create({
          email: email,
          password: hash,
          name: name
        }).then(() => {

          req.flash('msg', 'Conta cadastrada com sucesso')
          res.redirect("/admin/users")

        }).catch((error) => {

          req.flash('msg', 'Erro, Favor preencher todos campos')
          res.redirect("/admin/users/create")
          
        })
      }
    })
  }
})
router.get("/login", (req, res) => {
  res.render("admin/users/login", { erros: {}, msg: req.flash('msg') })
})

router.post("/authenticate", [
  //Validação
  check('email', "Favor inserir email valido").isEmail(),
  check('password', "Favor inserir senha maior de 5").isLength({ min: 5 }),
], (req, res) => {

  const erros = validationResult(req)
  if (!erros.isEmpty()) {
    res.render("admin/users/login", { erros: erros.mapped(), msg: '' })

  } else {

    var email = req.body.email
    var password = req.body.password
    var name = req.body.name

    User.findOne({ where: { email: email } }).then(user => {
      if (user != undefined) {
        var correct = bcrypt.compareSync(password, user.password)
        if (correct) {
          req.session.user = {
            id: user.id,
            email: user.email,
            name: user.name
          }
          req.flash('msg', 'Logado com sucesso')
          res.redirect("/admin/panel")
        } else {
          req.flash('msg', 'Email ou Senha invalido')
          res.redirect("/login")
        }
      } else {
        req.flash('msg', 'Email ou Senha invalido')
        res.redirect("/login")
      }
    })
  }
})
router.get("/logout", (req, res) => {
  req.session.user = undefined;
  req.flash('msg', 'Deslogado com sucesso')
  res.redirect("/login")
})
module.exports = router