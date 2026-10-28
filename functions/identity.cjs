function allowedIdentity(auth){return !!auth?.uid && auth.token?.email_verified===true && auth.token?.firebase?.sign_in_provider==='google.com' && /^[^@\s]+@mranti\.my$/i.test(auth.token?.email||'');}
module.exports={allowedIdentity};
