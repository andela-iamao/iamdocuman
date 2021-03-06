/* global describe:true */
/* global db:true */
/* global expect:true */
/* global request:true */

describe('Access Model', () => {
  beforeEach((done) => {
    db.sequelize.sync({ force: true }).done(() => {
      db.Access.create({ title: 'public' }).then(() => {
        done();
      });
    });
  });

  describe('Ceate Access', () => {
    it('should create a new access level', (done) => {
      db.Access.create({ title: 'private' })
        .then((access) => {
          expect(access.title).to.eql('private');
          done();
        });
    });
  });

  describe('Read Access', () => {
    it('should retrieve access level', (done) => {
      db.Access.findById(1)
        .then((access) => {
          expect(access.title).to.eql('public');
          done();
        });
    });
  });

  describe('Update Access', () => {
    it('should update a created access', (done) => {
      db.Access.findById(1)
        .then((access) => {
          const updatedAt = access.updatedAt;
          access.update({ title: 'private' })
            .then((updatedAccess) => {
              expect(updatedAccess.title).to.eql('private');
              expect(updatedAccess.updatedAt).to.not.eql(updatedAt);
              done();
            });
        });
    });
  });

  describe('Delete Access', () => {
    it('should delete a created access', (done) => {
      db.Access.destroy({ where: { id: 1 } })
        .then(() => {
          db.Access.findById(1)
            .then((destroyedAccess) => {
              expect(destroyedAccess).to.be.a('null');
              done();
            });
        });
    });
  });
});
