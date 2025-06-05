// Configuración de Firebase
const firebaseConfig = {
    apiKey: "AIzaSyCoSjpYuQM_vjVyOY3QdeMQCzqymQuJ8K8",
    authDomain: "nyc-cancer-trial---dev.firebaseapp.com",
    projectId: "nyc-cancer-trial---dev",
    storageBucket: "nyc-cancer-trial---dev.firebasestorage.app",
    messagingSenderId: "567320801353",
    appId: "1:567320801353:web:5747ea974fba184466cf98"
};

// Inicialización de Firebase
const fApp = firebase.initializeApp(firebaseConfig);
const db = fApp.firestore();
const auth = fApp.auth();

const ext = window.location.hostname === "127.0.0.1" || window.location.hostname === "localhost" ? ".html" : "";

const consoleLog = (data, data1) => {
    if (window.location.hostname === "127.0.0.1" || window.location.hostname === "localhost") {
        console.log(data, data1);
    }
}

// Aplicación Vue
const app = Vue.createApp({
    data() {
        return {
            init: false,
            user: null,
            userData: null,
            isAdmin: false,
            medicalCenters: [],
            users: [],
            medicalCenter: {},
            allTrials: [],
            center: {
                name: 'Lorem Ipsum',
                research_unit_name: 'Lorem Ipsum',
            },
            formUser: {
                name: 'Lorem Ipsum',
                role: 'VIEW',
                email: 'user@nyccancercenter.com',
                password: '123456',
                confirmPassword: '123456',
                currentCenters: [],
                medicalCenters: [],
            },
            trial: {
                name: 'Lorem Ipsum',
                sponsors: 'Tiae Dor Asim',
                nct: 'NCT00000000',
                brief_moa: 'Lorem Ipsum',
                mutation_or_key_biomarker: 'Lorem Ipsum',
                pi_name: 'Dor Asimet',
                key_team_contact: 'ivXQazySkKSn41TuMCNn_team2'
            },
            teamMember: {
                name: 'Lorem Ipsum',
                email: 'user@nyccancercenter.com',
                role: 'Lorem Ipsum',
                phone: '+12345678909',
            },
            loginForm: {
                email: 'ylayalysalas@gmail.com',
                password: '123456',
                error: null,
                success: false,
                loading: false,
                mode: 'physician',
            },
            formStatus: {
                error: null,
                success: false,
                loading: false,
                init: true
            },
            sendStatus: {
                error: null,
                success: false,
                loading: false
            },
            loading: true,
            dataMode: 'team',
            dataForm: 'new',
            confirmPopUp: false,
            pathname: window.location.pathname.split('/').pop(),
            openUsersList: false,
            confirmPassword: '',
            dev: {
                openNav: false
            }
        };
    },
    methods: {
        async signIn(ev) {
            ev.preventDefault();

            const isValid = this.validateForm();
            if (!isValid) return;

            try {
                this.loginForm.loading = true;
                this.loginForm.error = null;
                this.loginForm.success = null;

                await auth.signInWithEmailAndPassword(
                    this.loginForm.email,
                    this.loginForm.password
                );

                this.loginForm.success = true;

            } catch (error) {
                console.error(error.code, error.message);
                this.loginForm.error = error.message;
            } finally {
                this.loginForm.loading = false;
            }
            return false;
        },

        async signOut() {
            try {
                await auth.signOut();
                this.user = null;
                localStorage.removeItem('medicalCenter');
                localStorage.removeItem('medicalCenterTrial');
                localStorage.removeItem('medicalCenterTeamMember');
                localStorage.removeItem('formUser');
                localStorage.removeItem('trial');
                localStorage.removeItem('teamMember');
                localStorage.removeItem('center');
                localStorage.removeItem('mode');
            } catch (error) {
                console.error(error.code, error.message);
            } finally {
                window.location.href = '/';
            }
        },


        async getMedicalCenters(mC = null) {
            if (!auth.currentUser) return;

            try {
                const querySnapshot = await db.collection('medical_centers')
                    // .where("users", "array-contains", auth.currentUser.uid)
                    .get();

                const medicalCenter = localStorage.getItem('medicalCenter');
                if(medicalCenter && medicalCenter !== 'null' && medicalCenter !== 'undefined' && medicalCenter !== null && medicalCenter !== undefined){
                    this.medicalCenter = JSON.parse(medicalCenter);
                }

                this.medicalCenters = querySnapshot.docs.map(doc => {
                    return { id: doc.id, ...doc.data() };
                });

                if (this.medicalCenters.length > 0) {
                    
                    const medicalCentersByUser = this.medicalCenters.filter(center => center.users && center.users.includes(auth.currentUser.uid));
                    if (mC === false) {
                        this.medicalCenter = {};
                    } else if (medicalCenter && medicalCenter !== 'null' && medicalCenter !== 'undefined' && medicalCenter !== null && medicalCenter !== undefined) {
                        this.medicalCenter = JSON.parse(medicalCenter);
                    } else if(medicalCentersByUser.length > 0){
                        this.medicalCenter = medicalCentersByUser[0];
                    }else{
                        this.medicalCenter = this.medicalCenters[0];
                    }

                    await this.getMedicalCenterTeamMembers();
                    await this.getMedicalCenterTrials();

                }
                this.loading = false;
            } catch (error) {
                console.error("Error getting medical centers:", error);
            }
        },

        async getMedicalCenterById(id) {
            if (!auth.currentUser) return;

            this.closeNav();

            const mC = this.medicalCenters.find(mC => mC.id === id);
            this.medicalCenter = mC;

            localStorage.setItem('medicalCenter', JSON.stringify(this.medicalCenter));

            this.dataMode = this.dataMode === 'alltrials' || this.dataMode === 'trials' ? 'trials' : 'team';

            if (!window.location.pathname.includes('/dashboard')) {
                this.goToDashboard('team');
            }

            this.loading = true;
            try {
                const doc = await db.collection('medical_centers').doc(id).get();

                if (doc.exists) {
                    this.medicalCenter = { id: doc.id, ...doc.data() };
                    localStorage.setItem('medicalCenter', JSON.stringify(this.medicalCenter));

                    await this.getMedicalCenterTeamMembers();
                    await this.getMedicalCenterTrials();
                    this.loading = false;
                } else {
                    consoleLog("No such document!");
                    this.loading = false;
                }
            } catch (error) {
                console.error("Error getting medical center data:", error);
            }
        },

        async initMedicalCenter(isDelete = false) {
            const that = this;
            if (!isDelete)
                that.formStatus.success = true;

            setTimeout(() => {
                if (isDelete) {
                    that.confirmPopUp = false;
                }

                localStorage.removeItem('center');
                this.goToDashboard('centers');
            }, 1000);
        },


        setMedicalCenter() {
            this.formStatus.success = null;
            this.formStatus.error = null;

            if (!auth.currentUser) return;

            const isValid = this.validateForm();
            if (!isValid) return;

            const centerDoc = this.dataForm === 'new' ?
                db.collection('medical_centers').doc()
                : db.collection('medical_centers').doc(this.center.id);

            centerDoc.set(this.center)
                .then(this.initMedicalCenter)
                .catch((error) => {
                    this.formStatus.error = error;
                    console.error("Error adding center: ", error);
                });
        },

        deleteMedicalCenter() {
            this.sendStatus.success = null;
            this.sendStatus.error = null;

            if (!auth.currentUser) return;

            this.sendStatus.loading = true;

            const centerDoc = db.collection('medical_centers').doc(this.center.id);
            centerDoc.delete()
                .then(() => {
                    this.sendStatus.loading = false;
                    this.sendStatus.success = true;

                    this.initMedicalCenter(true);
                })
                .catch((error) => {
                    this.sendStatus.error = error;
                    console.error("Error deleting center: ", error);
                    this.sendStatus.loading = false;
                });
        },

        goToMedicalCenter(center) {
            localStorage.setItem('center', JSON.stringify(center));
            window.location.href = '/med-center' + ext;
        },

        getSelectedUsers(users) {
            const medicalCenterUsers = users;
            if (!medicalCenterUsers) return '';

            const selectedUsers = this.users.filter(user => {
                return medicalCenterUsers.includes(user.id);
            });

            return selectedUsers.map(user => user.name).join(', ');
        },

        changeUserToMedicalCenter(userId) {
            if (!this.center.users) this.center.users = [];
            if (this.center.users.includes(userId)) {
                this.center.users = this.center.users.filter(user => user !== userId);
            } else {
                this.center.users.push(userId);
            }
        },

        async getAllTrials() {
            this.dataMode = 'alltrials';
            this.closeNav();

            this.medicalCenter = {
                name: 'All',
                research_unit_name: 'All',
                id: 'alltrials'
            }

            let teamMembers = [];
            try {
                teamMembers = await db.collectionGroup('team_members').get();
                teamMembers = teamMembers.docs.map(doc => {
                    return { id: doc.id, ...doc.data() };
                });
            } catch (error) {
                console.error("Error getting team members data:", error);
            }

            try {
                const trials = await db.collectionGroup('trials').get();
                this.allTrials = trials.docs.map(doc => {
                    let contact = {};
                    let medicalCenter = "";
                    if (doc.data().contact && teamMembers) {
                        contact = teamMembers.find(team => team.id == doc.data().contact.id);
                    }
                    if (doc.ref.parent.parent.id) {
                        medicalCenter = this.medicalCenters.find(center => center.id == doc.ref.parent.parent.id);
                    }
                    return { id: doc.id, ...doc.data(), contact, medicalCenter };
                });
            } catch (error) {
                console.error("Error getting trials data:", error);
            }



        },
        async getMedicalCenterTrials() {
            if (!auth.currentUser || !this.medicalCenter) return;

            try {
                const doc = await db.collection('medical_centers').doc(this.medicalCenter.id).collection('trials').get();
                if (doc.docs.length > 0) {
                    this.medicalCenter.trials = await Promise.all(doc.docs.map(async doc => {
                        let contact = {};
                        if (doc.data().contact) {
                            contact = await this.getTeamMember(doc.data().contact);
                        }    
                        return { id: doc.id, ...doc.data(), contact, key_team_contact: contact.id };
                    }));
                } else {
                    consoleLog("No such document!");
                }
            } catch (error) {
                console.error("Error getting medical center data:", error);
            }
        },

        async getMedicalCenterTrialById(id) {
            if (!auth.currentUser || !this.medicalCenter) return;

            try {
                const doc = await db.collection('medical_centers').doc(this.medicalCenter.id).collection('trials').doc(id).get();

                if (doc.exists) {
                    this.trial = { id: doc.id, ...doc.data(), key_team_contact: doc.data().contact?.id };
                } else {
                    consoleLog("No such document!");
                }
            } catch (error) {
                console.error("Error getting medical center trial data:", error);
            }
        },

        async initMedicalCenterTrial(isDelete = false) {
            const that = this;
            if (!isDelete)
                that.formStatus.success = true;

            setTimeout(() => {
                if (isDelete) {
                    that.confirmPopUp = false;
                }

                localStorage.removeItem('medicalCenterTrial');
                this.goToDashboard('trials');
            }, 1000);
        },
        async setMedicalCenterTrial() {
            this.formStatus.success = null;
            this.formStatus.error = null;

            const isValid = this.validateForm();
            if (!isValid) return;

            if (!auth.currentUser || !this.medicalCenter) return;
            const that = this;

            if (that.trial.key_team_contact) {
                const contactRef = db.collection('team_members').doc(that.trial.key_team_contact);
                that.trial.contact = contactRef;
            }

            const trialDoc = this.dataForm === 'new' ?
                db.collection('medical_centers').doc(this.medicalCenter.id).collection('trials').doc()
                : db.collection('medical_centers').doc(this.medicalCenter.id).collection('trials').doc(that.trial.id);

            return trialDoc.set(that.trial)
                .then(() => {
                    this.initMedicalCenterTrial();
                })
                .catch((error) => {
                    that.formStatus.error = error;
                    console.error("Error adding trial: ", error);
                });
        },


        async deleteMedicalCenterTrial() {
            this.sendStatus.success = null;
            this.sendStatus.error = null;
            this.sendStatus.loading = true;

            if (!auth.currentUser || !this.medicalCenter) return;

            const trialDoc = db.collection('medical_centers').doc(this.medicalCenter.id).collection('trials').doc(this.trial.id);
            return trialDoc.delete()
                .then(() => {
                    this.sendStatus.success = true;
                    this.sendStatus.loading = false;

                    this.initMedicalCenterTrial(true);
                })
                .catch((error) => {
                    this.sendStatus.error = error;
                    console.error("Error deleting trial: ", error);
                    this.sendStatus.loading = false;
                });
        },

        goToMedicalCenterTrial(trial) {
            if(this.isAllowUser()){
                localStorage.setItem('medicalCenterTrial', JSON.stringify(trial));
                window.location.href = '/trial' + ext;   
            }
        },

        async getMedicalCenterTeamMembers() {
            if (!auth.currentUser || !this.medicalCenter) return;

            try {
                const doc = await db.collection('medical_centers').doc(this.medicalCenter.id).collection('team_members').get();
                if (doc.docs.length > 0) {
                    this.medicalCenter.team_members = doc.docs.map(doc => {
                        return { id: doc.id, ...doc.data() };
                    });
                } else {
                    consoleLog("No such document!");
                }
            } catch (error) {
                console.error("Error getting medical center data:", error);
            }
        },

        async getMedicalCenterTeamMemberById(data) {
            if (!auth.currentUser || !this.medicalCenter) return;

            try {
                const doc = await db.collection('medical_centers').doc(this.medicalCenter.id).collection('team_members').doc(data.id).get();

                if (doc.exists) {
                    this.teamMember = { id: doc.id, ...doc.data() };
                } else {
                    consoleLog("No such document!");
                }
            } catch (error) {
                console.error("Error getting medical center team member data:", error);
            }
        },

        async initMedicalCenterTeamMember(isDelete = false) {
            if (!isDelete)
                this.formStatus.success = true;
            setTimeout(() => {
                if (!isDelete) {
                    // this.formStatus.success = false;
                } else {
                    this.confirmPopUp = false;
                }

                this.dataForm = 'new';
                
                localStorage.removeItem('medicalCenterTeamMember');
                this.goToDashboard('team');
            }, 600);
        },

        async setMedicalCenterTeamMember() {
            this.formStatus.success = null;
            this.formStatus.error = null;

            const isValid = this.validateForm();
            if (!isValid) return;


            if (!auth.currentUser || !this.medicalCenter) return;
            const teamMember = this.teamMember;

            const teamMemberDoc = this.dataForm === 'new' ?
                db.collection('medical_centers').doc(this.medicalCenter.id).collection('team_members').doc()
                : db.collection('medical_centers').doc(this.medicalCenter.id).collection('team_members').doc(teamMember.id);

            return teamMemberDoc.set(teamMember)
                .then(this.initMedicalCenterTeamMember)
                .catch((error) => {
                    this.formStatus.error = error;
                    console.error("Error adding team member: ", error);
                });
        },

        deleteMedicalCenterTeamMember() {
            this.sendStatus.success = null;
            this.sendStatus.error = null;
            this.sendStatus.loading = true;

            if (!auth.currentUser) return;

            const teamMemberDoc = db.collection('medical_centers').doc(this.medicalCenter.id).collection('team_members').doc(this.teamMember.id);
            teamMemberDoc.delete()
                .then(() => {
                    this.sendStatus.success = true;
                    this.sendStatus.loading = false;

                    this.initMedicalCenterTeamMember(true);
                })
                .catch((error) => {
                    this.sendStatus.error = error;
                    console.error("Error deleting team member: ", error);
                    this.sendStatus.loading = false;
                });
        },

        goToMedicalCenterTeamMember(teamMember) {
            if(!this.isAllowUser()) return;
            localStorage.setItem('medicalCenterTeamMember', JSON.stringify(teamMember));
            window.location.href = '/team-member' + ext;
        },


        async getTeamMember(data) {
            if (!auth.currentUser || !data || !this.medicalCenter.id) return "";

            if (this.medicalCenter.team_members && this.medicalCenter.team_members.length > 0) {
                const tM = this.medicalCenter.team_members.find(teamMember => teamMember.id == data.id);
                return tM || {};
            }

            const teamMember = await db.collection('medical_centers').doc(this.medicalCenter.id).collection('team_members').doc(data.id).get();

            if (teamMember.exists) {
                return teamMember.data();
            }
            return {};
        },

        confirmCloseDropdown() {
            const el = document.querySelector('.daf-dropdown-1');
            $(el).triggerHandler('w-close.w-dropdown');

            this.confirmPopUp = true;
        },


        async getAllUsers() {
            if (!auth.currentUser || (auth.currentUser && !this.isAdmin)) return;

            try {
                const querySnapshot = await db.collection('users').get();
                this.users = querySnapshot.docs.map(doc => {
                    return { id: doc.id, ...doc.data() };
                });

            } catch (error) {
                console.error("Error getting users data:", error);
            }
        },

        async getUserData() {
            if (!auth.currentUser) return;
            let userData = null;

            try {
                const doc = await db.collection('users').doc(this.user.uid).get();

                if (doc.exists) {
                    userData = { id: doc.id, ...doc.data() };
                } else {
                    consoleLog("No such document!");
                }
            } catch (error) {
                console.error("Error getting user data:", error);
            }
            return userData;
        },

        getMedicalCentersByUser(user) {
            if (!auth.currentUser || !user) return "";

            if (user.role == 'ADMIN') return 'Admin';

            if (this.medicalCenters && this.medicalCenters.length > 0) {
                const mCs = this.medicalCenters.filter(center => center.users && center.users.includes(user.id));
                return mCs.map(c => c.name).join(', ');
            }

            return "";
        },

        initUser() {
            localStorage.removeItem('formUser');
            this.confirmPassword = "";

            setTimeout(() => {
                this.confirmPopUp = false;

                this.goToDashboard('users');
            }, 1000);
        },

        async getFormUser() {
            if (this.formUser && this.formUser.id) {
                try {
                    const doc = await db.collection('users').doc(this.formUser.id).get();

                    if (doc.exists) {
                        const medicalCenters = this.medicalCenters.filter(center => center.users && center.users.includes(doc.id));
                        const currentCenters = [...medicalCenters ];

                        this.formUser = { id: doc.id, ...doc.data() };
                        this.formUser.isAdmin = this.formUser.role == 'ADMIN';
                        this.formUser.medicalCenters = medicalCenters.map(c => c.id);
                        this.formUser.currentCenters = currentCenters.map(c => c.id);
                    } else {
                        consoleLog("No such document!");
                    }
                } catch (error) {
                    console.error("Error getting user data:", error);
                }
            }
        },

        async setUser() {
            const isValid = this.validateForm();
            if (!isValid || (!this.confirmPassword && this.dataForm === 'new')) return;

            this.formStatus.success = null;
            this.formStatus.error = null;
            this.sendStatus.success = null;
            this.sendStatus.error = null;

            if (!auth.currentUser) return;
            const user = this.formUser;
            this.sendStatus.loading = true;
            this.formStatus.loading = true;

            if (this.dataForm === 'new') {
                if( this.formUser.password !== this.formUser.confirmPassword) {
                    this.formStatus.error = true;
                    this.formStatus.loading = false;
                    return;
                }

                try {
                    const currentUserEmail = auth.currentUser.email + "";
                    await auth.signInWithEmailAndPassword(
                        currentUserEmail,
                        this.confirmPassword
                    );

                    user.userCredential = await firebase.auth().createUserWithEmailAndPassword(user.email, user.password)
                    this.formUser.id = user.userCredential.user.uid;

                    await auth.signInWithEmailAndPassword(
                        currentUserEmail,
                        this.confirmPassword
                    );

                    this.confirmPassword = "";
                    this.sendStatus.success = true;
                    this.sendStatus.loading = false;

                    setTimeout(() => {
                        this.confirmPopUp = false;
                        this.sendStatus.success = false;
                        this.sendStatus.error = false;
                    }, 1000);

                } catch (error) {
                    console.error("Error adding user: ", error.message);
                    this.sendStatus.loading = false;
                    this.sendStatus.error = true;
                    return;
                }
            }

            const userDoc = db.collection('users').doc(this.formUser.id);

            const _user = {
                name: this.formUser.name,
                role: this.formUser.isAdmin ? 'ADMIN' : 'VIEWER',
            }



            try {
                if (this.dataForm === 'new') {
                    _user.email = this.formUser.email;
                    await userDoc.set(_user);
                } else {
                    await userDoc.update(_user);
                }
                

                for (let i = 0; i < this.formUser.medicalCenters.length; i++) {
                    await this.updateMedicalCenterUsers(this.formUser.medicalCenters[i], this.formUser.id, 'add');
                }

                const removeCenters = this.formUser.currentCenters.filter(centerId => !this.formUser.medicalCenters.includes(centerId));
                for (let i = 0; i < removeCenters.length; i++) {
                    await this.updateMedicalCenterUsers(removeCenters[i], this.formUser.id, 'remove');
                }
                this.formStatus.success = true;
                this.initUser();

            } catch (error) {
                this.formStatus.error = true;
                console.error("Error adding user: ", error.message);
                this.formStatus.loading = false;
            }

        },

        goToUser(user) {
            localStorage.setItem('formUser', JSON.stringify(user));
            window.location.href = '/user' + ext;
        },

        async updateMedicalCenterUsers(centerId, userId, type) {
            if (!auth.currentUser) return;

            const centerDoc = await db.collection('medical_centers').doc(centerId).get();
            if (!centerDoc.exists) return;
            const users = centerDoc.data().users || [];
            if (!users.includes(userId) && type === 'add') {
                users.push(userId);
            } else if (users.includes(userId) && type === 'remove') {
                users.splice(users.indexOf(userId), 1);
            }

            try {
                await db.collection('medical_centers').doc(centerId).update({
                    users: users
                })
            } catch (error) {
                console.error("Error updating center: ", error);
                return false;
            }
            
            return true;
        },


        getSelectedMedicalCenters(mCs) {
            if (!mCs || mCs.length === 0) return 'Select one...';
            const centers = this.medicalCenters.filter(center => mCs.includes(center.id));
            return centers.map(center => center.name).join(', ');
        },

        changeMedicalCenterToUser(mCId) {
            if (!this.formUser.medicalCenters) {
                this.formUser.medicalCenters = [];
            }
            if (this.formUser.medicalCenters.includes(mCId)) {
                this.formUser.medicalCenters = this.formUser.medicalCenters.filter(id => id !== mCId);
            } else {
                this.formUser.medicalCenters.push(mCId);
            }
        },

        confirmCreateUser() {
            if(this.dataForm === 'new' && this.formUser.password !== this.formUser.confirmPassword) {
                this.formStatus.error = true;
                return;
            }

            if(this.dataForm === 'edit') {
                this.setUser();
                return;
            }

            const isValid = this.validateForm();
            if (!isValid) return;
            
            this.confirmPopUp = true;
        },

        async verifyAdmin() {
            if (!auth.currentUser) return;

            const userData = await this.getUserData();
            this.isAdmin = userData && userData.role == 'ADMIN';

        },

        validateForm() {
            this.formStatus.valid = null;
            
            const form = document.querySelector('[data-form-validate]');
            const isValid = form.checkValidity();
            form.classList.add('was-validated');
            this.formStatus.valid = isValid;

            return isValid;
        },

        goToDashboard(mode = 'team') {
            // localStorage.removeItem('medicalCenter');
            localStorage.removeItem('medicalCenterTrial');
            localStorage.removeItem('medicalCenterTeamMember');
            localStorage.removeItem('formUser');
            localStorage.removeItem('center');

            localStorage.setItem('mode', mode);

            this.dataMode = mode;
            if(!window.location.pathname.includes('dashboard')){
                 window.location.href = '/dashboard' + ext;
            }else{
                // this.loading = true;
                if(mode == 'centers' || mode == 'users'){
                    this.medicalCenter = {};
                }
                if((mode == 'trials' || mode == 'team') && !this.medicalCenter.id){
                   this.getMedicalCenters();
                }
            }
        },

        closeNav() {
            const el = document.querySelector('.moj-dropdown-1');
            $(el).triggerHandler('w-close.w-dropdown');
        },
    
        isAllowUser() {
            return this.isAdmin || (this.medicalCenter && this.medicalCenter.users && this.medicalCenter.users.includes(auth.currentUser.uid));
        },


        checkUser() {
            auth.onAuthStateChanged(async (user) => {
                this.user = user;

                if (user) {
                    if (this.pathname == '' || this.pathname == 'index.html') {
                        this.goToDashboard('team');
                    }
                    await this.verifyAdmin();
                    if (this.pathname == 'dashboard' + ext) {
                        this.loading = true;

                        if (this.isAdmin) {
                            this.getAllUsers();
                        }
                        
                        if((this.dataMode == 'centers' || this.dataMode == 'users') && !this.isAdmin){
                            localStorage.setItem('mode', 'team');
                            this.dataMode = 'team';
                        }
                        this.getMedicalCenters(this.dataMode != 'centers' && this.dataMode != 'users');

                    }
                    if (this.pathname == 'trial' + ext) {
                        this.getMedicalCenters();
                        this.dataMode = 'trials';
                        const trial = localStorage.getItem('medicalCenterTrial');
                        this.dataForm = 'new';
                        if (trial) {
                            this.trial = JSON.parse(trial);
                            this.getMedicalCenterTrialById(this.trial.id);
                            this.dataForm = 'edit';
                        }
                    }
                    if (this.pathname == 'team-member' + ext) {
                        this.getMedicalCenters();
                        this.dataMode = 'team';
                        const teamMember = localStorage.getItem('medicalCenterTeamMember');
                        this.dataForm = 'new';
                        if (teamMember) {
                            this.teamMember = JSON.parse(teamMember);
                            this.getMedicalCenterTeamMemberById(this.teamMember.id);
                            this.dataForm = 'edit';
                        }
                    }
                    if (this.pathname == 'med-center' + ext) {
                        if (!this.isAdmin) {
                            window.location.href = '/dashboard' + ext;
                        }
                        this.dataForm = 'new';
                        const center = localStorage.getItem('center');
                        if (center) {
                            this.center = JSON.parse(center);
                            this.dataForm = 'edit';
                        }

                        this.getMedicalCenters(false);
                        this.getAllUsers();
                        this.dataMode = 'centers';
                    }

                    if (this.pathname == 'user' + ext) {
                        if (this.confirmPassword) {
                            return;
                        }

                        if (!this.isAdmin) {
                            window.location.href = '/dashboard' + ext;
                        }
                        
                        this.getMedicalCenters(false);
                        this.dataMode = 'users';
                        const formUser = localStorage.getItem('formUser');
                        this.dataForm = 'new';

                        if (formUser) {
                            this.formUser = JSON.parse(formUser);
                            this.formUser.isAdmin = this.formUser.role == 'ADMIN';
                            this.dataForm = 'edit';
                            this.getFormUser();
                        }
                        this.formStatus.init = false;
                        
                        
                    }


                    this.init = true;
                } else {
                    if (this.pathname != '' && this.pathname != 'index.html') {
                        window.location.href = '/';
                    }
                }

            });

            const inputs = document.querySelectorAll('input');
            const selects = document.querySelectorAll('select');
            
            inputs.forEach(input => {
                input.addEventListener('input', () => {
                    this.formStatus.valid = null;
                })
            })
            selects.forEach(select => {
                select.addEventListener('change', () => {
                    this.formStatus.valid = null;
                })
            })
        },
    },
    mounted() {
        const mode = localStorage.getItem('mode');
        if (mode) {
            this.dataMode = mode;
        }
        this.checkUser();
        const container = document.getElementById('app');
        container.classList.remove('nyc-app');

    }
});

app.mount('#app');
