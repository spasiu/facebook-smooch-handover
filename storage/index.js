const fs = require('fs');

// this storage takes the place of a real key value storage mechanism for POC
module.exports = {
    getByFbId: (fbId) => {
        try {
            return fs.readFileSync(`./storage/facebookToSmooch/${fbId}`).toString();
        } catch(error) {
            return null;
        }
    },

    getBySmoochId: (smoochId) => {
        try {
            return fs.readFileSync(`./storage/smoochToFacebook/${smoochId}`).toString();
        } catch(error) {
            return null;
        }
    },

    setByFbId: (fbId, smoochId) => {
        fs.writeFileSync(`./storage/facebookToSmooch/${fbId}`, smoochId);
    },

    setBySmoochId: (smoochId, fbId) => {
        fs.writeFileSync(`./storage/smoochToFacebook/${smoochId}`, fbId);
    },
};
