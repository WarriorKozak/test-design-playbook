const Result = require('../models/result');
const Applicant = require('../models/user');
const router = require('express').Router();
const Employer = require('../models/employer');
const mailgun = require('../mail/mailing');
const Model = require('../models/model');

router.post('/results/save', (req, res) => {
  const models = req.body.models;
  const token = req.token;
  let number = 0;
  let applicant;
  Model.find({})
    .then(modelsDocs => {
      models.filter(i => i.mark).forEach(item => {
        modelsDocs.forEach(modelDocs => {
          if (item.model._id.toString() === modelDocs._id.toString()) {
            number += modelDocs.mark;
          }
        })
      });
      return Promise.resolve(number);
    })
    .then(number => {
      return Applicant.findOneAndUpdate(
        { token: token },
        { status: Applicant.STATUS_EVALUATED, mark: number },
        { upsert: true, new: true});
    })
    .then(applicantDocs => {
      applicant = applicantDocs;
      return Result.findOneAndUpdate({ token: token }, { solved_models: models, applicant: applicantDocs });
    })
    .then((modelsDocs) => {
      return Employer.find({ notify: true });
    })
    .then((employers) => {
      const sends = employers.map((employer) => {
        return mailgun.testCompleted({
          name: applicant.first_name,
          surname: applicant.surname,
          email: employer.email,
          mark: applicant.mark
        })
      });
      return Promise.all(sends);

    })
    .then(() => {
      res.json({message: 'Save successful'});
    })
    .catch((err) => {
      res.status(500).send(err);
    });
});

router.post('/results/update', (req, res) => {
  const models = req.body.models;
  const token = req.token;
  Applicant.findOne({ token: token, status: Applicant.STATUS_IS_FILLING })
    .then((applicantDocs) => {
      return Result.findOneAndUpdate({ token: token }, {
        solved_models: models,
        applicant: applicantDocs,
        token: token,
        solved_date: Date(),
        deleted: false
      }, { upsert: true });
    })
    .then((results) => {
      res.send(results);
    })
    .catch((err) => {
      res.status(err.status).send(err);
    })
});

router.get('/results/all', (req, res) => {
  getResults(false, req, res);
});

router.get('/results/archived', (req, res) => {
  getResults(true, req, res);
});

router.post('/results/one', (req, res) => {
  const token = req.body.token;
  Result.findOne({ token: token })
    .then((docs) => {
      if (docs) return res.send(docs);
      throw {status: 422, message: 'Can\'t find token'};
    })
    .catch((err) => res.status(err.status).send(err));
});


router.post('/results/surname', (req, res) => {
  const surname = req.body.surname;
  Result.find({ deleted: false }, { deleted: 0 })
    .then((docs) => {
      if (docs) {
        return res.send(docs.filter((item) => item.applicant.surname.startsWith(surname)))
      }
      throw { status: 422, message: 'Can\'t find surname' };
    })
    .catch((err) => res.status(err.status).send(err));
});

router.post('/results/delete', (req, res) => {
  updateStatus(true, req, res);
});

router.post('/results/undelete', (req, res) => {
  updateStatus(false, req, res);
});

console.log('[Result Controller]', 'load routes');

function updateStatus(deleted, req, res) {
  const token = req.body.token;
  Result.findOneAndUpdate({ token: token }, { deleted: deleted })
    .then( (docs) => {
      res.send({ message: 'Deleted successfully', docs: docs });
    })
    .catch((err) => {
      res.status(500).send(err);
    });
}

function getResults(deleted, req, res) {
  if (req.access !== 'admin') {
    return res.status(403).send('You do not have permission');
  }
  Result.find({ deleted: deleted }, { deleted: 0 })
    .then((resultsDocs) => {
      resultsDocs.sort((a, b) => b.solved_date - a.solved_date);
      res.send(resultsDocs);
    })
    .catch((err) => res.status(err.status).send(err));
}

module.exports = router;

