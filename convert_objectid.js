db.horarios.find({maestroId: { $type: 'objectId' }}).forEach(function(doc) {
  db.horarios.updateOne(
    { _id: doc._id },
    { $set: { maestroId: doc.maestroId.toString() } }
  );
});
