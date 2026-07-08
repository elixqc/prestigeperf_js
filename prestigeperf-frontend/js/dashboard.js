$(document).ready(function () {
    const url = 'http://localhost:3000/';
    const token = JSON.parse(sessionStorage.getItem('token'));
    const role = sessionStorage.getItem('role');

    if (!token) {
        Swal.fire({
            icon: 'error',
            text: 'Please login first.',
            position: 'bottom-right',
            showConfirmButton: false,
            timer: 1500
        }).then(() => {
            window.location.href = 'login.html';
        });
        return;
    } else if (role !== 'admin') {
        $('body').show();
        Swal.fire({
            icon: 'error',
            text: 'Access denied. Redirecting...',
            position: 'bottom-right',
            showConfirmButton: false,
            timer: 1500
        }).then(() => {
            window.location.href = 'home.html';
        });
        return;
    }

    $('body').show();

    // ─── Load Sidebar ─────────────────────────────────────────────────────────
    $.get("sidebar.html?v=" + new Date().getTime(), function (data) {
        $("#sidebar").html(data);

        const page = window.location.pathname.split('/').pop().replace('.html', '');
        $(`.pp-sidebar-link[data-page="${page}"]`).addClass('active');

        $(document).on('click', '#btn-logout', function (e) {
            e.preventDefault();
            $.ajax({
                method: 'POST',
                url: `${url}api/v1/logout`,
                headers: { Authorization: `Bearer ${token}` },
                success: function () {
                    sessionStorage.clear();
                    window.location.href = 'login.html';
                },
                error: function () {
                    sessionStorage.clear();
                    window.location.href = 'login.html';
                }
            });
        });
    });

    // ─── Luxury Palette (from your CSS tokens) ────────────────────────────────
    const COLORS = {
        primary:     '#8b1a4a',
        primaryDark: '#6d1339',
        gold:        '#c9a96e',
        goldLight:   '#e8d5a3',
        textDark:    '#1a0d14',
        textMid:     '#5a3d4a',
        textMuted:   '#7a5a68',
    };

    // Palette for multi-color charts (pie/bar)
    const LUXURY_PALETTE = [
        '#8b1a4a',
        '#c9a96e',
        '#5a3d4a',
        '#6d1339',
        '#e8d5a3',
        '#7a5a68',
        '#3d2030',
        '#b8933a',
        '#1a0d14',
        '#9a6b7a',
    ];

    // ─── Chart.js Global Defaults ─────────────────────────────────────────────
    Chart.defaults.font.family = "'Jost', 'Segoe UI', sans-serif";
    Chart.defaults.font.size = 13;
    Chart.defaults.font.weight = '500';
    Chart.defaults.color = COLORS.textMid;

    let barChartInstance = null;
    let pieChartInstance = null;
    let lineChartInstance = null;

    function loadCharts(period = 'all') {

        // ─── Stats ────────────────────────────────────────────────────────────
        $.ajax({
            method: 'GET',
            url: `${url}api/v1/dashboard/stats?period=${period}`,
            headers: { Authorization: `Bearer ${token}` },
            success: function (data) {
                $('#total-sales').text('₱' + Number(data.stats.totalSales).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                }));
                $('#total-orders').text(data.stats.totalOrders);
                $('#total-users').text(data.stats.totalUsers);
                $('#total-categories').text(data.stats.totalCategories);
            }
        });

        // ─── Bar Chart ────────────────────────────────────────────────────────
        if (barChartInstance) barChartInstance.destroy();
        $.ajax({
            method: 'GET',
            url: `${url}api/v1/dashboard/bar-chart`,
            headers: { Authorization: `Bearer ${token}` },
            success: function (data) {
                barChartInstance = new Chart($('#barChart'), {
                    type: 'bar',
                    data: {
                        labels: data.labels,
                        datasets: [{
                            label: 'Stock Quantity',
                            data: data.data,
                            backgroundColor: COLORS.primary,
                            borderColor: COLORS.primaryDark,
                            borderWidth: 1,
                            borderRadius: 4,
                            hoverBackgroundColor: COLORS.gold,
                            hoverBorderColor: COLORS.gold,
                        }]
                    },
                    options: {
                        responsive: true,
                        plugins: {
                            legend: { display: false },
                            tooltip: {
                                backgroundColor: COLORS.textDark,
                                titleColor: COLORS.gold,
                                bodyColor: '#fff',
                                borderColor: COLORS.gold,
                                borderWidth: 0.5,
                                padding: 10,
                                cornerRadius: 4,
                            }
                        },
                        scales: {
                            x: {
                                grid: { display: false },
                                ticks: {
                                    color: COLORS.textMuted,
                                    font: { size: 10, family: "'Jost', sans-serif" }
                                },
                                border: { color: 'rgba(201,169,110,0.2)' }
                            },
                            y: {
                                beginAtZero: true,
                                ticks: {
                                    stepSize: 1,
                                    color: COLORS.textMuted,
                                    font: { size: 10 }
                                },
                                grid: { color: 'rgba(201,169,110,0.1)' },
                                border: { color: 'rgba(201,169,110,0.2)' }
                            }
                        }
                    }
                });
            }
        });

        // ─── Pie Chart ────────────────────────────────────────────────────────
        if (pieChartInstance) pieChartInstance.destroy();
        $.ajax({
            method: 'GET',
            url: `${url}api/v1/dashboard/pie-chart?period=${period}`,
            headers: { Authorization: `Bearer ${token}` },
            success: function (data) {
                const labels = data.labels.length > 0 ? data.labels : ['No Data'];
                const values = data.data.length > 0 ? data.data : [1];

                pieChartInstance = new Chart($('#pieChart'), {
                    type: 'pie',
                    data: {
                        labels,
                        datasets: [{
                            data: values,
                            backgroundColor: LUXURY_PALETTE.slice(0, labels.length),
                            borderColor: '#fff',
                            borderWidth: 2,
                            hoverOffset: 6,
                        }]
                    },
                    options: {
                        responsive: true,
                        plugins: {
                            legend: {
                                position: 'bottom',
                                labels: {
                                    color: COLORS.textMid,
                                    font: { size: 11, family: "'Jost', sans-serif" },
                                    padding: 16,
                                    usePointStyle: true,
                                    pointStyleWidth: 8,
                                }
                            },
                            tooltip: {
                                backgroundColor: COLORS.textDark,
                                titleColor: COLORS.gold,
                                bodyColor: '#fff',
                                borderColor: COLORS.gold,
                                borderWidth: 0.5,
                                padding: 10,
                                cornerRadius: 4,
                            }
                        }
                    }
                });
            }
        });

        // ─── Line Chart ───────────────────────────────────────────────────────
        if (lineChartInstance) lineChartInstance.destroy();
        $.ajax({
            method: 'GET',
            url: `${url}api/v1/dashboard/line-chart?period=${period}`,
            headers: { Authorization: `Bearer ${token}` },
            success: function (data) {
                lineChartInstance = new Chart($('#lineChart'), {
                    type: 'line',
                    data: {
                        labels: data.labels,
                        datasets: [{
                            label: 'Orders',
                            data: data.data,
                            borderColor: COLORS.primary,
                            backgroundColor: 'rgba(139,26,74,0.08)',
                            borderWidth: 1.5,
                            tension: 0.4,
                            fill: true,
                            pointBackgroundColor: COLORS.gold,
                            pointBorderColor: COLORS.primary,
                            pointBorderWidth: 1.5,
                            pointRadius: 4,
                            pointHoverRadius: 6,
                            pointHoverBackgroundColor: COLORS.gold,
                        }]
                    },
                    options: {
                        responsive: true,
                        plugins: {
                            legend: {
                                display: true,
                                labels: {
                                    color: COLORS.textMid,
                                    font: { size: 11 },
                                    usePointStyle: true,
                                }
                            },
                            tooltip: {
                                backgroundColor: COLORS.textDark,
                                titleColor: COLORS.gold,
                                bodyColor: '#fff',
                                borderColor: COLORS.gold,
                                borderWidth: 0.5,
                                padding: 10,
                                cornerRadius: 4,
                            }
                        },
                        scales: {
                            x: {
                                grid: { display: false },
                                ticks: {
                                    color: COLORS.textMuted,
                                    font: { size: 10 }
                                },
                                border: { color: 'rgba(201,169,110,0.2)' }
                            },
                            y: {
                                beginAtZero: true,
                                ticks: {
                                    stepSize: 1,
                                    color: COLORS.textMuted,
                                    font: { size: 10 }
                                },
                                grid: { color: 'rgba(201,169,110,0.1)' },
                                border: { color: 'rgba(201,169,110,0.2)' }
                            }
                        }
                    }
                });
            }
        });
    }

    loadCharts('all');

    $(document).on('click', '.btn-period', function () {
        $('.btn-period').removeClass('active');
        $(this).addClass('active');
        loadCharts($(this).data('period'));
    });
});