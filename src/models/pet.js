const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const petSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    type: {
        type: String,
        required: true
    },
    imageUrls: {
        type: [Schema.Types.Mixed],
        required: true
    },
    creator: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, { timestamps: true });

/* petSchema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform: function (doc, ret) { delete ret._id }
}); */
module.exports = mongoose.model('Pet', petSchema);