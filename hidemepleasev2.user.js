// ==UserScript==
// @name        Hide Me Please
// @namespace    http://tampermonkey.net/
// @version      1.18
// @description  Masquer des lignes dans un tableau avec Tampermonkey
// @author       Vous
// @match        https://www.amazon.fr/vine/vine-reviews*
// @icon         https://pickme.alwaysdata.net/img/314858-hidden-eye-icon.png
// @grant        GM_registerMenuCommand
// @grant        GM_setValue
// @grant        GM_getValue
// @downloadURL https://raw.githubusercontent.com/Ashemka/HideMePlease/main/hidemepleaseV2.user.js
// @updateURL    https://raw.githubusercontent.com/Ashemka/HideMePlease/main/hidemepleaseV2.user.js

// ==/UserScript==

(function() {
    'use strict';
    // Vérifier si l'URL contient "review-type=pending_review"
    if (!window.location.href.includes("review-type=pending_review")) {
        return; // Sortir si l'URL ne correspond pas au critère
    }
    // Par défaut, masquer les lignes cochées et les lignes avec des dates antérieures à 2023
    let hideOldRows = GM_getValue('hideOldRows', true);
    let hideAllRows = GM_getValue('hideAllRows', true);
    let autoHideEnabled = JSON.parse(localStorage.getItem('autoHideEnabled')) || false;
    let autoHideInterval;
    // Ajouter des commandes du menu utilisateur pour basculer l'affichage des lignes masquées et des lignes anciennes
    GM_registerMenuCommand(hideOldRows ? 'Désactiver le masquage automatique selon la date' : 'Activer le masquage automatique selon la date', () => {
        hideOldRows = !hideOldRows;
        GM_setValue('hideOldRows', hideOldRows);
        location.reload();
    });
    GM_registerMenuCommand(hideAllRows ? 'Afficher tous les avis' : 'Masquer tous les avis', () => {
        hideAllRows = !hideAllRows;
        GM_setValue('hideAllRows', hideAllRows);
        location.reload();
    });
    // Ajouter un style CSS pour masquer toutes les lignes initialement
    const initialStyle = document.createElement('style');
    initialStyle.textContent = `
        .vvp-reviews-table--row {
            display: none;
        }
    `;
    document.head.appendChild(initialStyle);
    // Récupérer les lignes masquées depuis le stockage local
    const hiddenRows = JSON.parse(localStorage.getItem('hiddenRows')) || {};
    // Stocker le total initial des avis
    const headingTop = document.querySelector('.vvp-reviews-table--heading-top');
    const totalElement = headingTop.querySelector('h3');
    const initialTotal = parseInt(totalElement.textContent.match(/\d+/)[0], 10);
    // Ajouter le bouton pour activer/désactiver le masquage automatique
    const actionsColHeading = document.getElementById('vvp-reviews-table--actions-col-heading');
    const autoHideButton = document.createElement('button');
    autoHideButton.textContent = autoHideEnabled ? 'Désactiver masquage automatique' : 'Activer masquage automatique';
    autoHideButton.className = 'a-button a-button-primary';
    autoHideButton.style.marginLeft = '10px';
    actionsColHeading.appendChild(autoHideButton);
    autoHideButton.addEventListener('click', () => {
        autoHideEnabled = !autoHideEnabled;
        localStorage.setItem('autoHideEnabled', JSON.stringify(autoHideEnabled));
        autoHideButton.textContent = autoHideEnabled ? 'Désactiver masquage automatique' : 'Activer masquage automatique';
        if (autoHideEnabled) {
            startAutoHide();
        } else {
            clearInterval(autoHideInterval);
        }
    });
    // Fonction pour activer automatiquement le bouton "Suivant"
    const startAutoHide = () => {
        autoHideInterval = setInterval(() => {
            const nextButton = document.querySelector('li.a-last a[href*="review-type=pending_review"]');
            if (nextButton) {
                nextButton.click();
            } else {
                clearInterval(autoHideInterval);
            }
        }, Math.random() * (2154 - 1810) + 1810);
    };
    if (autoHideEnabled) {
        startAutoHide();
    }
    // Fonction pour mettre à jour le total des avis
    const updateTotal = () => {
        const hiddenCount = Object.keys(hiddenRows).length;
        const newTotal = initialTotal - hiddenCount;
        totalElement.textContent = `Avis (${newTotal})`;
    };
    // Fonction pour masquer/afficher une ligne
    const toggleRowVisibility = (row, id) => {
        if (row.classList.contains('hidden-row')) {
            row.classList.remove('hidden-row');
            delete hiddenRows[id];
        } else {
            row.classList.add('hidden-row');
            hiddenRows[id] = true;
        }
        localStorage.setItem('hiddenRows', JSON.stringify(hiddenRows));
        updateTotal();
    };
    // Fonction pour masquer les lignes avec une date de commande avant le 31/12/2022
    const masquerLignesAvant2023 = () => {
        const lignes = document.querySelectorAll('.vvp-reviews-table--row');
        lignes.forEach(ligne => {
            const dateCell = Array.from(ligne.querySelectorAll('td')).find(td => td.hasAttribute('data-order-timestamp'));
            if (dateCell) {
                const orderTimestamp = parseInt(dateCell.getAttribute('data-order-timestamp'), 10);
                const orderDate = new Date(orderTimestamp);
                if (orderDate < new Date('2023-01-01')) {
                    const id = ligne.querySelector('input[type="checkbox"]').id.replace('check_', '');
                    ligne.classList.add('hidden-row');
                    hiddenRows[id] = true;
                }
            }
        });
        localStorage.setItem('hiddenRows', JSON.stringify(hiddenRows));
    };
    // Ajouter les icônes de masquage et gérer les lignes masquées initialement
    document.querySelectorAll('.vvp-reviews-table--row').forEach(row => {
        const statusCell = Array.from(row.querySelectorAll('td')).find(td => td.textContent.trim().includes('Pas encore examiné'));
        if (statusCell) {
            const id = row.querySelector('input[type="checkbox"]').id.replace('check_', '');
            // Créer un conteneur pour centrer le bouton sous le texte
            const container = document.createElement('div');
            container.style.display = 'flex';
            container.style.flexDirection = 'column';
            container.style.alignItems = 'center';
            // Déplacer le texte existant dans le conteneur
            while (statusCell.firstChild) {
                container.appendChild(statusCell.firstChild);
            }
            statusCell.appendChild(container);
            // Ajouter le bouton pour masquer/afficher
            const hideButton = document.createElement('img');
            hideButton.src = 'https://pickme.alwaysdata.net/img/314858-hidden-eye-icon.png';
            hideButton.alt = 'Masquer';
            hideButton.style.width = '28px';
            hideButton.style.height = '28px';
            hideButton.style.marginTop = '5px';
            hideButton.style.cursor = 'pointer';
            container.appendChild(hideButton);
            hideButton.addEventListener('click', () => toggleRowVisibility(row, id));
            if (hiddenRows[id]) {
                row.classList.add('hidden-row');
            }
        }
    });
    // Ajouter un style CSS pour la classe hidden-row
    const style = document.createElement('style');
    style.textContent = `
        .hidden-row {
            display: none;
        }
    `;
    document.head.appendChild(style);
    // Masquer ou afficher les lignes cochées et les anciennes lignes au chargement de la page en fonction des options du menu utilisateur
    window.onload = () => {
        if (hideOldRows) {
            masquerLignesAvant2023(); // Marquer automatiquement les lignes avant 2023 comme hidden-row
        }
        if (hideAllRows) {
            Object.keys(hiddenRows).forEach(id => {
                const checkbox = document.querySelector(`#check_${id}`);
                if (checkbox) {
                    const row = checkbox.closest('.vvp-reviews-table--row');
                    if (row) {
                        row.classList.add('hidden-row');
                    }
                }
            });
        } else {
            Object.keys(hiddenRows).forEach(id => {
                const checkbox = document.querySelector(`#check_${id}`);
                if (checkbox) {
                    const row = checkbox.closest('.vvp-reviews-table--row');
                    if (row) {
                        row.classList.remove('hidden-row');
                    }
                }
            });
        }
        // Retirer le style CSS initial pour afficher les lignes non masquées
        initialStyle.remove();
        // Mettre à jour le total des avis initialement
        updateTotal();
    };
})();
