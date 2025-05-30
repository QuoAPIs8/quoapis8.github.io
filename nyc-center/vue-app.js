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

const ext = window.location.hostname === "127.0.0.1" ? ".html" : "";

const consoleLog = (data, data1) => {
    if(window.location.hostname === "127.0.0.1"){
        console.log(data, data1);
    }
}

// Aplicación Vue
const app = Vue.createApp({
    data() {
        return {
            user: null,
            userData: null,
            medicalCenters: [],
            medicalCenter: {
                name: ' ',
                location: ' ',
                
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
                fullname: 'Lorem Ipsum',
                email: 'ylayalysalas@gmail.com',
                role: 'Lorem Ipsum',
                phone: '+12345678909',
            },
            loginForm: {
                email: 'ylayalysalas@gmail.com',
                password: '123456',
                error: null,
                success: false,
                loading: false,
                mode: 'physician'
            },
            formStatus: {
                error: null,
                success: false,
                loading: false
            },
            deleteStatus: {
                error: null,
                success: false,
                loading: false
            },
            loading: false,
            dataMode: 'team',
            dataForm: 'new',
            confirmDeletePopUp: false,
            pathname: window.location.pathname.split('/').pop()
        };
    },
    methods: {
        async signIn(ev) {
            ev.preventDefault();
            consoleLog(ev);

            try {
                this.loginForm.loading = true;
                this.loginForm.error = null;
                this.loginForm.success = null;
                
                const userCredential = await auth.signInWithEmailAndPassword(
                    this.loginForm.email, 
                    this.loginForm.password
                );
                
                this.user = userCredential.user;
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
            consoleLog('Signing out...');
            try {
                await auth.signOut();
                this.user = null;
                localStorage.removeItem('medicalCenter');
                localStorage.removeItem('medicalCenterTrial');
                localStorage.removeItem('medicalCenterTeamMember');
            } catch (error) {
                console.error(error.code, error.message);
            } finally {
                window.location.href = '/';
            }
        },
        
        async getUserData() {
            if (!auth.currentUser) return;
            
            try {
                const doc = await db.collection('users').doc(auth.currentUser.uid).get();
                
                if (doc.exists) {
                    this.userData = doc.data();
                    consoleLog("User data:", this.userData);
                } else {
                    consoleLog("No such document!");
                }
            } catch (error) {
                console.error("Error getting user data:", error);
            }
        },
        
        async getMedicalCenters() {
            if (!auth.currentUser) return;
            
            try {
                const querySnapshot = await db.collection('medical_centers')
                    // .where("users", "array-contains", auth.currentUser.uid)
                    .get();
                
                consoleLog("Medical centers found:", querySnapshot.docs.length);
                
                this.medicalCenters = querySnapshot.docs.map(doc => {
                    return { id: doc.id, ...doc.data()};
                });

                if(this.medicalCenters.length > 0){
                    const medicalCenter = localStorage.getItem('medicalCenter');
                    if(medicalCenter){  
                        this.medicalCenter = JSON.parse(medicalCenter);
                    }else{
                        this.medicalCenter = this.medicalCenters[0];
                    }

                    await this.getMedicalCenterTeamMembers();
                    await this.getMedicalCenterTrials();  
                    this.loading = false;
                }

            } catch (error) {
                console.error("Error getting medical centers:", error);
            }
        },

        async getMedicalCenterById(id){
            if (!auth.currentUser) return;

            const el = document.querySelector('.moj-dropdown-1');
            $(el).triggerHandler('w-close.w-dropdown');

            this.loading = true;
            try {
                const doc = await db.collection('medical_centers').doc(id).get();
                
                if (doc.exists) {
                    this.medicalCenter = {id: doc.id, ...doc.data()};
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
        async getMedicalCenterTrials(){
            if (!auth.currentUser) return;
            
            try {
                const doc = await db.collection('medical_centers').doc(this.medicalCenter.id).collection('trials').get();
                consoleLog("Medical center trials:", doc.docs);
                if (doc.docs.length > 0) {
                    this.medicalCenter.trials = await Promise.all(doc.docs.map(async doc => {
                        let contact = {};
                        if(doc.data().contact){
                            contact = await this.getTeamMember(doc.data().contact);
                        }
                        return { id: doc.id, ...doc.data(), contact };
                    }));
                    consoleLog("Medical center data:", this.medicalCenter);
                } else {
                    consoleLog("No such document!");
                }
            } catch (error) {
                console.error("Error getting medical center data:", error);
            }
        },

        async getMedicalCenterTrialById(id){
            if (!auth.currentUser) return;
            
            try {
                const doc = await db.collection('medical_centers').doc(this.medicalCenter.id).collection('trials').doc(id).get();
                
                if (doc.exists) {
                    this.trial = {id: doc.id, ...doc.data()};
                    consoleLog("Medical center trial data:", this.trial);
                } else {
                    consoleLog("No such document!");
                }
            } catch (error) {
                console.error("Error getting medical center trial data:", error);
            }
        },

        async initMedicalCenterTrial(isDelete = false){
            const that = this;
            if(!isDelete)
                that.formStatus.success = true;
            setTimeout(() => {
                if(!isDelete){
                    that.formStatus.success = false;
                }else{
                    that.confirmDeletePopUp = false;
                }
                that.dataForm = 'new';
                that.trial = {
                    name: 'Lorem Ipsum',
                    sponsors: 'Tiae Dor Asim',
                    nct: 'NCT00000000',
                    brief_moa: 'Lorem Ipsum',
                    mutation_or_key_biomarker: 'Lorem Ipsum',
                    pi_name: 'Dor Asimet',
                    key_team_contact: 'ivXQazySkKSn41TuMCNn_team2'
                };
                localStorage.removeItem('medicalCenterTrial');
                window.location.href = '/dashboard?mode=trial';
            }, 1000);
        },
        async setMedicalCenterTrial(){
            this.formStatus.success = null;
            this.formStatus.error = null;
            if (!auth.currentUser) return;
            const that = this;
            
            const contactRef = db.collection('team_members').doc(that.trial.key_team_contact);
            that.trial.contact = contactRef;
            
            const trialDoc = this.dataForm === 'new' ? 
                db.collection('medical_centers').doc(this.medicalCenter.id).collection('trials').doc()
                : db.collection('medical_centers').doc(this.medicalCenter.id).collection('trials').doc(that.trial.id);

            return trialDoc.set(that.trial)
            .then(this.initMedicalCenterTrial)
            .catch((error) => {
                that.formStatus.error = error;
                console.error("Error adding trial: ", error);
            });
        },


        async deleteMedicalCenterTrial(){
            this.deleteStatus.success = null;
            this.deleteStatus.error = null;
            this.deleteStatus.loading = true;

            if (!auth.currentUser) return;
            
            const trialDoc = db.collection('medical_centers').doc(this.medicalCenter.id).collection('trials').doc(this.trial.id);
            return trialDoc.delete()
                .then(() => {
                    this.deleteStatus.success = true;
                    this.deleteStatus.loading = false;
                    
                    this.initMedicalCenterTrial(true);
                })
                .catch((error) => {
                    this.deleteStatus.error = error;
                    console.error("Error deleting trial: ", error);
                    this.deleteStatus.loading = false;
                });
        },

        changeMedicalCenterTrial(trial){
            // localStorage.setItem('medicalCenterTrial', JSON.stringify(trial));
            // window.location.href = '/form-template' + ext;
        },

        async getMedicalCenterTeamMembers(){
            if (!auth.currentUser) return;
            
            try {
                const doc = await db.collection('medical_centers').doc(this.medicalCenter.id).collection('team_members').get();
                consoleLog("Medical center team members:", doc.docs);
                if (doc.docs.length > 0) {
                    this.medicalCenter.team_members = doc.docs.map(doc => {
                        return { id: doc.id, ...doc.data()};
                    });
                    consoleLog("Medical center data:", this.medicalCenter);
                } else {
                    consoleLog("No such document!");
                }
            } catch (error) {
                console.error("Error getting medical center data:", error);
            }
        },

        async getMedicalCenterTeamMemberById(data){
            if (!auth.currentUser) return;
            
            try {
                const doc = await db.collection('medical_centers').doc(this.medicalCenter.id).collection('team_members').doc(data.id).get();
                
                if (doc.exists) {
                    this.teamMember = {id: doc.id, ...doc.data()};


                    consoleLog("Medical center team member data:", this.teamMember);
                } else {
                    consoleLog("No such document!");
                }
            } catch (error) {
                console.error("Error getting medical center team member data:", error);
            }
        },

        async initMedicalCenterTeamMember(isDelete = false){
            if(!isDelete)
                this.formStatus.success = true;
            setTimeout(() => {
                if(!isDelete){
                    this.formStatus.success = false;
                }else{
                    this.confirmDeletePopUp = false;
                }

                this.dataForm = 'new';
                this.teamMember = {
                    fullname: 'Lorem Ipsum',
                    email: 'ylayalysalas@gmail.com',
                    role: 'Lorem Ipsum',
                    phone: '+12345678909',
                };
                localStorage.removeItem('medicalCenterTeamMember');
                window.location.href = '/dashboard' + ext;
            }, 1000);
        },

        async setMedicalCenterTeamMember(){
            this.formStatus.success = null;
            this.formStatus.error = null;
            if (!auth.currentUser) return;
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

        deleteMedicalCenterTeamMember(){
            this.deleteStatus.success = null;
            this.deleteStatus.error = null;
            this.deleteStatus.loading = true;

            if (!auth.currentUser) return;
            
            const teamMemberDoc = db.collection('medical_centers').doc(this.medicalCenter.id).collection('team_members').doc(this.teamMember.id);
                teamMemberDoc.delete()
                .then(() => {
                    this.deleteStatus.success = true;
                    this.deleteStatus.loading = false;
                    
                    this.initMedicalCenterTeamMember(true);
                })
                .catch((error) => {
                    this.deleteStatus.error = error;
                    console.error("Error deleting team member: ", error);
                    this.deleteStatus.loading = false;
                });
        },

        changeMedicalCenterTeamMember(teamMember){
            // localStorage.setItem('medicalCenterTeamMember', JSON.stringify(teamMember));
            // window.location.href = '/form-team-template' + ext;
        },

        async getTeamMember(data){
            if (!auth.currentUser || !data || !this.medicalCenter.id) return "";
            consoleLog(data.id)

            if(this.medicalCenter.team_members && this.medicalCenter.team_members.length > 0){
                return this.medicalCenter.team_members.find(teamMember => teamMember.id == data.id);
            }
            
            const teamMember = await db.collection('medical_centers').doc(this.medicalCenter.id).collection('team_members').doc(data.id).get();
            consoleLog(teamMember.data());
            return teamMember.data();
        },

        confirmDeleteMedicalCenterItem(){
            const el = document.querySelector('.daf-dropdown-1');
            $(el).triggerHandler('w-close.w-dropdown');

            this.confirmDeletePopUp = true;
        },

        insertTeamMembers(){
            const temas = [
                {
                    "name": "Dr. Eleanor Vance",
                    "email": "eleanor.vance@yale.edu",
                    "phone": "(203) 555-0301",
                    "role": "Director of Medical Oncology"
                },
                {
                    "name": "Dr. Samuel Greene",
                    "email": "samuel.greene@yale.edu",
                    "phone": "(203) 555-0302",
                    "role": "Chief of Surgical Oncology"
                },
                {
                    "name": "Isabelle Moreau",
                    "email": "isabelle.moreau@yale.edu",
                    "phone": "(203) 555-0303",
                    "role": "Oncology Clinical Nurse Specialist"
                },
                {
                    "name": "Dr. Charles Wright",
                    "email": "charles.wright@yale.edu",
                    "phone": "(203) 555-0304",
                    "role": "Head of Radiation Oncology"
                },
                {
                    "name": "Dr. Aisha Khan",
                    "email": "aisha.khan@yale.edu",
                    "phone": "(203) 555-0305",
                    "role": "Hematologic Malignancies Specialist"
                },
                {
                    "name": "Marcus Choi",
                    "email": "marcus.choi@yale.edu",
                    "phone": "(203) 555-0306",
                    "role": "Cancer Genomics Researcher"
                },
                {
                    "name": "Dr. Olivia Bennett",
                    "email": "olivia.bennett@yale.edu",
                    "phone": "(203) 555-0307",
                    "role": "Pediatric Oncologist"
                },
                {
                    "name": "Liam O'Connell",
                    "email": "liam.oconnell@yale.edu",
                    "phone": "(203) 555-0308",
                    "role": "Patient Support Services Coordinator"
                },
                {
                    "name": "Dr. Hannah Jorgenson",
                    "email": "hannah.jorgenson@yale.edu",
                    "phone": "(203) 555-0309",
                    "role": "Thoracic Oncology Lead"
                },
                {
                    "name": "David Rodriguez",
                    "email": "david.rodriguez@yale.edu",
                    "phone": "(203) 555-0310",
                    "role": "Clinical Trials Office Manager"
                },
                {
                    "name": "Dr. Kenji Tanaka",
                    "email": "kenji.tanaka@yale.edu",
                    "phone": "(203) 555-0311",
                    "role": "GI Oncology Specialist"
                },
                {
                    "name": "Fatima Al-Jamil",
                    "email": "fatima.aljamil@yale.edu",
                    "phone": "(203) 555-0312",
                    "role": "Oncology Pharmacist"
                },
                {
                    "name": "Dr. Nora Fitzgerald",
                    "email": "nora.fitzgerald@yale.edu",
                    "phone": "(203) 555-0313",
                    "role": "Director of Cancer Research"
                },
                {
                    "name": "Benjamin Carter",
                    "email": "benjamin.carter@yale.edu",
                    "phone": "(203) 555-0314",
                    "role": "Data Analyst for Clinical Studies"
                },
                {
                    "name": "Dr. Sofia Ivanova",
                    "email": "sofia.ivanova@yale.edu",
                    "phone": "(203) 555-0315",
                    "role": "Breast Cancer Program Director"
                },
                {
                    "name": "Ethan Schmidt",
                    "email": "ethan.schmidt@yale.edu",
                    "phone": "(203) 555-0316",
                    "role": "Community Outreach Coordinator"
                }
            ];

            temas.forEach(async (teamMember) => {
                const teamMemberDoc = db.collection('medical_centers').doc("G4ebUF50yCTzMD92kHc3").collection('team_members').doc();

                teamMemberDoc.set(teamMember)
                .then(() => {
                    console.log("Team member added successfully");
                })
                .catch((error) => {
                    console.error("Error adding team member: ", error);
                });
            });
        },
        
        async actualiceTrials(){
            const medicalCenters = await db.collection('medical_centers').get();
            medicalCenters.forEach(async (medicalCenter) => {
                const trials = await db.collection('medical_centers').doc(medicalCenter.id).collection('trials').get();
                trials.forEach(async (trial) => {
                    const contactRef = db.collection('team_members').doc(trial.data().contact);
                    console.log(trial.data().contact);
                    db.collection('medical_centers').doc(medicalCenter.id).collection('trials').doc(trial.id).set({
                        contact: contactRef
                    })
                    .then(() => {
                        console.log("Trial updated successfully");
                    })
                    .catch((error) => {
                        console.error("Error updating trial: ", error);
                    });
                });
            });
        },
        
        checkUser() {
            auth.onAuthStateChanged(async (user) => {
                this.user = user;
                consoleLog(this.pathname, this.user);
                if (user) {
                    if(this.pathname == '' || this.pathname == 'index.html'){
                        this.dataMode = 'form';
                        window.location.href = '/dashboard' + ext;
                    }
                    if(this.pathname == 'dashboard' + ext){
                        this.getUserData();
                        this.getMedicalCenters();
                        this.dataMode = 'team';
                        this.loading = true;

                        const urlQuery = window.location.search;
                        const urlParams = new URLSearchParams(urlQuery);
                        const mode = urlParams.get('mode');

                        if(mode){
                            window.history.replaceState(null, null, '/dashboard');
                        }
                        
                        if(mode == 'trial'){
                            this.dataMode = 'trials';
                        }
                    }
                    if(this.pathname == 'form-template' + ext){
                        this.getUserData();
                        this.getMedicalCenters();
                        this.dataMode = 'trials';
                        const trial = localStorage.getItem('medicalCenterTrial');
                        this.dataForm = 'new';
                        if(trial){
                            this.trial = JSON.parse(trial);
                            this.getMedicalCenterTrialById(this.trial.id);
                            this.dataForm = 'edit';
                        }
                    }
                    if(this.pathname == 'form-team-template' + ext){
                        this.getUserData();
                        this.getMedicalCenters();
                        this.dataMode = 'team';
                        const teamMember = localStorage.getItem('medicalCenterTeamMember');
                        this.dataForm = 'new';
                        if(teamMember){
                            this.teamMember = JSON.parse(teamMember);
                            this.getMedicalCenterTeamMemberById(this.teamMember.id);
                            this.dataForm = 'edit';
                        }
                    }
                }else{
                    if(this.pathname != '' && this.pathname != 'index.html'){
                        window.location.href = '/';
                    }
                }
            });
        },
    },
    mounted() {
        consoleLog('Init App');
        this.checkUser();
        const container = document.getElementById('app');
        container.classList.remove('nyc-app');

    }
});

app.mount('#app');
