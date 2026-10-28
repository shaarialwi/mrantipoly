const assert=require('node:assert/strict');const {allowedIdentity}=require('../functions/identity.cjs');
const auth=(email,verified=true,provider='google.com')=>({uid:'user1',token:{email,email_verified:verified,firebase:{sign_in_provider:provider}}});
assert(allowedIdentity(auth('shaari@mranti.my')));assert(allowedIdentity(auth('STAFF@MRANTI.MY')));
for(const a of [null,{},auth('user@gmail.com'),auth('user@mranti.my.evil.com'),auth('user@sub.mranti.my'),auth('fake@evil@mranti.my'),auth('user@mranti.my',false),auth('user@mranti.my',true,'password'),auth('user@mranti.my',true,'anonymous'),auth('user @mranti.my')])assert.equal(allowedIdentity(a),false);
console.log('PASS: exact MRANTI domain, Google provider and verified email required; unrelated domains, subdomains, suffix tricks and other providers rejected.');
