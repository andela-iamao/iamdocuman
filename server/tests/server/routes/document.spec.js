/* global describe:true */
/* global db:true */
/* global expect:true */
/* global request:true */
/* global jwt:true */
/* global faker:true */
const tokenize = (id, username, roleId) => jwt.sign({
  exp: Math.floor(Date.now() / 1000) + (60),
  data: { id, username, roleId }
}, process.env.JWT_SECRET);


describe('Routes: documents', () => {
  const User = db.Users;
  const Role = db.Roles;
  const Document = db.Document;
  const tokens = { admin: [], regular: [], custom: [] };
  let docId;
  let privateDocId;
  const users = { admin: [], regular: [], custom: [] };
  beforeEach((done) => {
    db.sequelize.sync({ force: true }).done(() => {
      Role.bulkCreate([{
        title: 'custom', id: 3
      }, {
        title: 'regular', id: 2
      }, {
        title: 'admin', id: 1
      }]).then(() => {
        User.destroy({ where: {} })
          .then(() => {
            User.bulkCreate(faker.bulkCreateUser, { individualHooks: true })
            .then((res) => {
              res.forEach((user) => {
                switch (user.roleId) {
                  case 1:
                    users.admin.push(user.id);
                    tokens.admin.push(tokenize(
                      user.id,
                      user.username,
                      1
                    ));
                    break;
                  case 3:
                    users.custom.push(user.id);
                    tokens.custom.push(tokenize(
                      user.id,
                      user.username,
                      3
                    ));
                    break;
                  default:
                    users.regular.push(user.id);
                    tokens.regular.push(tokenize(
                      user.id,
                      user.username,
                      2
                    ));
                }
              });
              db.Access.bulkCreate(faker.allAccess).then(() => {
                const docs = faker.createDocument(users.admin[0])
                            .concat(faker.createDocument(users.custom[0]))
                            .concat(faker.createDocument(users.custom[1]))
                            .concat(faker.createDocument(users.regular[0]));
                Document.bulkCreate(docs, {
                  individualHooks: true
                })
                .then((createdDocs) => {
                  docId = createdDocs[21].id;
                  privateDocId = createdDocs[15].id;
                  done();
                });
              });
            });
          });
      });
    });
  });
  afterEach((done) => {
    db.Roles.destroy({ where: {} })
      .then(() => {
        db.Access.destroy({ where: {} }).then(() => {
          done();
        });
      });
  });
  describe('GET /api/v1/documents', () => {
    it('returns all documents in the database with default limit of 10 per page',
    (done) => {
      request.get('/api/v1/documents')
        .set('Authorization', tokens.admin[0])
        .expect(200)
        .end((err, res) => {
          expect(Object.keys(res.body.documents.results)).to.have.lengthOf(10);
          done(err);
        });
    });
    it('should reject request if user does not have token', (done) => {
      request.get('/api/v1/documents')
        .expect(401)
        .end((err, res) => {
          expect(res.body.message)
          .to.eql('Sorry you don\'t have permission to perform this operation');
          done(err);
        });
    });
    it('should reject request if user has invalid token', (done) => {
      request.get('/api/v1/documents')
        .set('Authorization', `e${tokens.admin[0]}`)
        .expect(401)
        .end((err, res) => {
          expect(res.body.message)
          .to.eql('Sorry you don\'t have permission to perform this operation');
          done(err);
        });
    });
  });

  describe('GET /api/v1/documents/?limit={Integer}&offset={Integer}', () => {
    it('should return 3 documents per page',
    (done) => {
      request.get('/api/v1/documents/?limit=3')
        .set('Authorization', tokens.admin[0])
        .expect(200)
        .end((err, res) => {
          expect(Object.keys(res.body.documents.results)).to.have.lengthOf(3);
          done(err);
        });
    });
    it('should request if query parameter is not an integer', (done) => {
      request.get('/api/v1/documents/?limit=bal&offset=4')
        .set('Authorization', tokens.admin[0])
        .expect(400)
        .end((err, res) => {
          expect(res.body.message)
          .to.eql('Invalid input for query');
          done(err);
        });
    });
  });

  describe('POST /api/v1/documents', () => {
    it('should create a document', (done) => {
      const doc = faker.publicDocument;
      request.post('/api/v1/documents')
        .set('Authorization', tokens.regular[0])
        .send(doc)
        .expect(200)
        .end((err, res) => {
          expect(res.body.title).to.eql(doc.title);
          done(err);
        });
    });
    it('should reject request from users without a token', (done) => {
      const doc = faker.publicDocument;
      request.post('/api/v1/documents')
        .send(doc)
        .expect(401)
        .end((err, res) => {
          expect(res.body.message)
          .to.eql('Sorry you don\'t have permission to perform this operation');
          done(err);
        });
    });
    it('should reject request from users with invalid token', (done) => {
      const doc = faker.publicDocument;
      request.post('/api/v1/documents')
        .set('Authorization', `${tokens.regular[0]}e`)
        .send(doc)
        .expect(401)
        .end((err, res) => {
          expect(res.body.message)
          .to.eql('Sorry you don\'t have permission to perform this operation');
          done(err);
        });
    });
    it('should reject request without a title', (done) => {
      const doc = { ...faker.publicDocument };
      delete doc.title;
      request.post('/api/v1/documents')
        .set('Authorization', tokens.regular[0])
        .send(doc)
        .expect(400)
        .end((err, res) => {
          expect(res.body.message).to.eql('title cannot be null');
          done(err);
        });
    });
    it('should reject request without a content', (done) => {
      const doc = { ...faker.publicDocument };
      delete doc.content;
      request.post('/api/v1/documents')
        .set('Authorization', tokens.regular[0])
        .send(doc)
        .expect(400)
        .end((err, res) => {
          expect(res.body.message).to.eql('content cannot be null');
          done(err);
        });
    });
  });

  describe('GET /api/v1/documents/:id', () => {
    it('should get a document', (done) => {
      request.get(`/api/v1/documents/${docId}`)
        .set('Authorization', tokens.regular[0])
        .expect(200)
        .end((err, res) => {
          expect(res.body.id).to.eql(docId);
          done(err);
        });
    });
    it('should return error if document does not exist', (done) => {
      request.get('/api/v1/documents/83383')
        .set('Authorization', tokens.regular[0])
        .expect(404)
        .end((err, res) => {
          expect(res.body.message).to.eql('document not found');
          done(err);
        });
    });
    it('should return error if private document does not belong to requester',
    (done) => {
      request.get(`/api/v1/documents/${privateDocId}`)
        .set('Authorization', tokens.regular[0])
        .expect(401)
        .end((err, res) => {
          expect(res.body.message)
            .to.eql('You don\'t have permission to view this document');
          done(err);
        });
    });
  });

  describe('PUT /api/v1/documents/:id', () => {
    it('should update a document', (done) => {
      request.put(`/api/v1/documents/${docId}`)
        .set('Authorization', tokens.regular[0])
        .send({ title: 'Doc Update' })
        .expect(204)
        .end((err, res) => {
          expect(res.body)
          .to.eql({});
          done(err);
        });
    });
    it('should return error if document does not exist', (done) => {
      request.put('/api/v1/documents/083383')
        .set('Authorization', tokens.regular[0])
        .send({ title: 'Doc Update' })
        .expect(404)
        .end((err, res) => {
          expect(res.body.message).to.eql('document not found');
          done(err);
        });
    });
    it('should return error if document does not belong to requester',
    (done) => {
      request.put(`/api/v1/documents/${docId}`)
        .set('Authorization', tokens.regular[1])
        .send({ title: 'Doc Update' })
        .expect(401)
        .end((err, res) => {
          expect(res.body.message)
            .to.eql('You don\'t have permission to update this document');
          done(err);
        });
    });
  });

  describe('DELETE /api/v1/documents/:id', () => {
    it('should delete a document', (done) => {
      request.delete(`/api/v1/documents/${docId}`)
        .set('Authorization', tokens.regular[0])
        .expect(204)
        .end((err, res) => {
          expect(res.body).to.eql({});
          done(err);
        });
    });
    it('should return error if document does not exist', (done) => {
      request.delete('/api/v1/documents/083383')
        .set('Authorization', tokens.regular[0])
        .expect(404)
        .end((err, res) => {
          expect(res.body.message).to.eql('document not found');
          done(err);
        });
    });
    it('should return error if document does not belong to requester',
    (done) => {
      request.delete(`/api/v1/documents/${docId}`)
        .set('Authorization', tokens.regular[1])
        .expect(401)
        .end((err, res) => {
          expect(res.body.message)
            .to.eql('You don\'t have permission to delete this document');
          done(err);
        });
    });
  });
});
